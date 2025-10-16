import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

function timingSafeEqual(a: string, b: string): boolean {
  // Ensure both strings are the same length to prevent length-based timing attacks
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  self.crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Session storage for staff (in production, use Redis or database)
export const staffSessionStore = new Map<
  string,
  {
    staffId: string
    name: string
    assignedProject: string | null
    createdAt: number
    expiresAt: number
  }
>()

// Rate limiting map
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number; lockUntil?: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const WINDOW_DURATION = 5 * 60 * 1000 // 5 minutes

function getRateLimitKey(ip: string): string {
  return `staff_auth_${ip}`
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip)
  const data = rateLimitMap.get(key)

  if (!data) return false

  const now = Date.now()

  if (data.lockUntil && now < data.lockUntil) {
    return true
  }

  if (now - data.lastAttempt > WINDOW_DURATION) {
    rateLimitMap.delete(key)
    return false
  }

  return data.attempts >= MAX_ATTEMPTS
}

function recordAttempt(ip: string, success: boolean) {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const data = rateLimitMap.get(key) || { attempts: 0, lastAttempt: now }

  if (success) {
    rateLimitMap.delete(key)
    return
  }

  data.attempts += 1
  data.lastAttempt = now

  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockUntil = now + LOCKOUT_DURATION
  }

  rateLimitMap.set(key, data)
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return timingSafeEqual(passwordHash, hash)
}

async function ensureStaffInDatabase(supabase: any) {
  const { data: existingStaff, error } = await supabase
    .from("security_staff")
    .select("file_id")
    .in("file_id", ["3252", "3242", "3253", "2234", "3245", "3248"])

  if (error) {
    console.error("[v0] Error checking staff in database:", error)
    return false
  }

  // If staff members already exist, no need to set up
  if (existingStaff && existingStaff.length > 0) {
    console.log("[v0] Staff members already exist in database:", existingStaff.length)
    return true
  }

  console.log("[v0] No staff members found in database. Setting up staff credentials...")

  const staffMembers = [
    { fileId: "3252", name: "Mohus" },
    { fileId: "3242", name: "Umair" },
    { fileId: "3253", name: "Salman" },
    { fileId: "2234", name: "Tanweer" },
    { fileId: "3245", name: "Tilak" },
    { fileId: "3248", name: "Ramesh" },
  ]

  let successCount = 0

  for (const member of staffMembers) {
    const password = member.name
    const passwordHash = await hashPassword(password)

    const { error: insertError } = await supabase.from("security_staff").insert({
      file_id: member.fileId,
      full_name: member.name,
      password_hash: passwordHash,
    })

    if (insertError) {
      console.error(`[v0] Error inserting staff member ${member.name}:`, insertError.message)
    } else {
      successCount++
      console.log(
        `[v0] ✅ Staff member ${member.name} (${member.fileId}) added to security_staff table with password: ${member.name}`,
      )
    }
  }

  if (successCount === 0) {
    console.error("[v0] ⚠️  Failed to add any staff members to security_staff table.")
    return false
  }

  console.log(`[v0] Staff setup complete: ${successCount}/${staffMembers.length} members added to security_staff table`)
  return successCount > 0
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many failed attempts. Please try again later." }, { status: 429 })
    }

    const { fileId, password } = await request.json()

    const supabase = await createServiceRoleClient()

    await ensureStaffInDatabase(supabase)

    const { data: staff, error: fetchError } = await supabase
      .from("security_staff")
      .select("id, file_id, full_name, password_hash")
      .eq("file_id", fileId)
      .single()

    if (fetchError || !staff) {
      console.log("[v0] Staff not found in security_staff table for file_id:", fileId)
      recordAttempt(ip, false)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return NextResponse.json({ error: "Invalid File ID or Password" }, { status: 401 })
    }

    // Check if password hash exists
    if (!staff.password_hash) {
      console.error("[v0] No password hash found for staff:", staff.full_name)
      return NextResponse.json(
        { error: "Account not properly configured. Please contact administrator." },
        { status: 500 },
      )
    }

    // Verify password against stored hash
    const isValidPassword = await verifyPassword(password, staff.password_hash)

    if (isValidPassword) {
      recordAttempt(ip, true)

      const { data: assignments } = await supabase
        .from("assignments")
        .select("project_name")
        .eq("staff_id", staff.file_id)

      const assignedProject = assignments && assignments.length > 0 ? assignments[0].project_name : null

      const sessionToken = generateSessionToken()
      const now = Date.now()
      const expiresAt = now + 8 * 60 * 60 * 1000 // 8 hours (work shift)

      // Store session server-side
      staffSessionStore.set(sessionToken, {
        staffId: staff.file_id,
        name: staff.full_name,
        assignedProject: assignedProject,
        createdAt: now,
        expiresAt: expiresAt,
      })

      console.log("[v0] Staff session created for:", staff.full_name, "Token:", sessionToken.substring(0, 8) + "...")
      console.log("[v0] Session stored in memory, expires at:", new Date(expiresAt).toISOString())

      const response = NextResponse.json({
        success: true,
        staff: {
          fileId: staff.file_id,
          name: staff.full_name,
          assignedProject: assignedProject,
        },
        sessionToken: sessionToken,
      })

      response.cookies.set("staff-session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(expiresAt),
        path: "/",
      })

      console.log("[v0] Staff session cookie set with lax sameSite policy")

      return response
    } else {
      console.log("[v0] Invalid password for staff:", staff.full_name)
      recordAttempt(ip, false)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return NextResponse.json({ error: "Invalid File ID or Password" }, { status: 401 })
    }
  } catch (error) {
    console.error("[v0] Staff auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
