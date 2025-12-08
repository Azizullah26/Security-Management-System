import { type NextRequest, NextResponse } from "next/server"
import { adminSessionStore } from "@/lib/auth-utils"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Auto-auth request received")

    const allCookies = request.cookies.getAll()
    console.log("[v0] All cookies received:", allCookies.map((c) => c.name).join(", "))

    let staffToken = request.headers.get("x-staff-session-token")
    console.log("[v0] Staff token from header:", staffToken ? "found" : "missing")

    // Check if user has a valid staff session from cookie as fallback
    if (!staffToken) {
      const staffSessionCookie = request.cookies.get("staff-session")
      console.log("[v0] Staff session cookie:", staffSessionCookie ? "found" : "missing")

      if (staffSessionCookie) {
        staffToken = staffSessionCookie.value
        console.log("[v0] Staff session cookie value:", staffToken.substring(0, 8) + "...")
      }
    }

    if (!staffToken) {
      console.log("[v0] No staff session found in header or cookie")
      return NextResponse.json({ error: "No staff session found" }, { status: 401 })
    }

    console.log("[v0] Checking staff session in database...")

    const supabase = getSupabaseClient()
    const { data: staffSession, error } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", staffToken)
      .maybeSingle()

    console.log("[v0] Staff session found in database:", staffSession ? "yes" : "no")

    if (error || !staffSession) {
      console.log("[v0] Staff session not found in database:", error?.message || "no session")
      return NextResponse.json({ error: "Staff session not found" }, { status: 401 })
    }

    if (staffSession) {
      console.log("[v0] Staff session details - staffId:", staffSession.staff_id, "name:", staffSession.name)
    }

    const now = Date.now()

    if (now > staffSession.expires_at) {
      console.log("[v0] Staff session expired")
      console.log("[v0] Session expired at:", new Date(staffSession.expires_at).toISOString())
      console.log("[v0] Current time:", new Date(now).toISOString())

      await supabase.from("staff_sessions").delete().eq("session_token", staffToken)

      return NextResponse.json({ error: "Staff session expired" }, { status: 401 })
    }

    // Check if the staff user is "Admin"
    if (staffSession.staff_id !== "Admin") {
      console.log("[v0] Staff user is not Admin:", staffSession.staff_id)
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    console.log("[v0] Admin user verified from staff session, creating admin session...")

    // Create admin session
    const sessionToken = generateSessionToken()
    const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours

    const { error: insertError } = await supabase.from("admin_sessions").insert({
      session_token: sessionToken,
      created_at: now,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error("[v0] Failed to store admin session in database:", insertError)
      return NextResponse.json({ error: "Failed to create admin session" }, { status: 500 })
    }

    adminSessionStore.set(sessionToken, {
      createdAt: now,
      expiresAt: expiresAt,
    })

    console.log("[v0] Admin session created automatically for Admin user")
    console.log("[v0] Session token:", sessionToken.substring(0, 8) + "...")

    const response = NextResponse.json({
      success: true,
      message: "Admin session created",
      token: sessionToken, // Return token to client for localStorage storage
    })

    // Set admin session cookie
    response.cookies.set("admin-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    })

    console.log("[v0] Admin session cookie set")

    return response
  } catch (error) {
    console.error("[v0] Auto-auth error:", error)
    return NextResponse.json({ error: "Auto-authentication failed" }, { status: 500 })
  }
}
