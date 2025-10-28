import type { NextRequest } from "next/server"
import { staffSessionStore } from "@/lib/session-store"
import { supabase } from "@/lib/supabase"

// Shared admin session store (in-memory cache for performance)
export const adminSessionStore = new Map<
  string,
  {
    createdAt: number
    expiresAt: number
  }
>()

export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  console.log("[v0] Verifying admin session...")

  let token: string | null = null

  // Check Authorization header first (for token-based auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7)
    console.log("[v0] Authorization header token:", token ? "present" : "missing")
  }

  // Fallback to cookie-based auth
  if (!token) {
    token = request.cookies.get("admin-session")?.value || null
    console.log("[v0] Admin session cookie:", token ? "present" : "missing")
  }

  if (!token) {
    console.log("[v0] No admin session cookie or token found")
    return false
  }

  try {
    // Check in-memory cache first for performance
    const cachedSession = adminSessionStore.get(token)
    if (cachedSession) {
      const now = Date.now()
      if (now <= cachedSession.expiresAt) {
        console.log("[v0] ✅ Admin session verified from cache")
        return true
      } else {
        // Remove expired session from cache
        adminSessionStore.delete(token)
      }
    }

    // Check Supabase for persistent session
    console.log("[v0] Checking Supabase for session...")
    const { data: session, error } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .single()

    if (error || !session) {
      console.log("[v0] Session not found in Supabase:", error?.message)
      return false
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    if (now > expiresAt) {
      console.log("[v0] Session expired, removing from Supabase")
      await supabase.from("admin_sessions").delete().eq("session_token", token)
      return false
    }

    // Update last accessed time
    await supabase.from("admin_sessions").update({ last_accessed_at: now.toISOString() }).eq("session_token", token)

    // Cache the session in memory for future requests
    adminSessionStore.set(token, {
      createdAt: new Date(session.created_at).getTime(),
      expiresAt: expiresAt.getTime(),
    })

    console.log("[v0] ✅ Admin session verified from Supabase")
    return true
  } catch (error) {
    console.error("[v0] Session verification error:", error)
    return false
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return require("crypto").randomBytes(32).toString("hex")
}

export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  const providedToken = request.headers.get("x-csrf-token")
  if (!providedToken || !expectedToken) {
    return false
  }

  // Use constant-time comparison
  const crypto = require("crypto")
  const maxLength = Math.max(providedToken.length, expectedToken.length)
  const paddedProvided = providedToken.padEnd(maxLength, "\0")
  const paddedExpected = expectedToken.padEnd(maxLength, "\0")

  return (
    crypto.timingSafeEqual(Buffer.from(paddedProvided), Buffer.from(paddedExpected)) &&
    providedToken.length === expectedToken.length
  )
}

// Input validation helpers
export function validateEntryRecord(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || typeof data.name !== "string" || data.name.length > 100) {
    errors.push("Name is required and must be less than 100 characters")
  }

  if (!data.category || typeof data.category !== "string") {
    errors.push("Category is required")
  }

  if (data.contactNumber !== undefined && data.contactNumber !== null) {
    if (typeof data.contactNumber !== "string" || data.contactNumber.length > 20) {
      errors.push("Contact number must be a string and less than 20 characters")
    }
  }

  if (data.company && typeof data.company !== "string") {
    errors.push("Company must be a string")
  }

  if (data.purpose && typeof data.purpose !== "string") {
    errors.push("Purpose must be a string")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Ensure staff has a valid project assignment
export function validateStaffProjectAssignment(staffSession: any): boolean {
  return staffSession && staffSession.assignedProject && staffSession.assignedProject.trim() !== ""
}

// Request size validation
export function validateRequestSize(data: any): boolean {
  const jsonString = JSON.stringify(data)
  return jsonString.length <= 1024 * 500 // 500KB limit for large staff photos
}

export async function verifyStaffSession(request: NextRequest): Promise<{
  authenticated: boolean
  staffId?: string
  name?: string
  assignedProject?: string | null
} | null> {
  console.log("[v0] Verifying staff session...")

  let token: string | null = null

  // Check Authorization header first (for token-based auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7)
    console.log("[v0] Staff authorization header token:", token ? "present" : "missing")
  }

  // Check localStorage token (sent as header)
  const localStorageToken = request.headers.get("x-staff-session-token")
  if (localStorageToken) {
    console.log("[v0] Staff localStorage token:", localStorageToken ? "present" : "missing")
    token = localStorageToken
  }

  // Fallback to cookie-based auth
  if (!token) {
    token = request.cookies.get("staff-session")?.value || null
    console.log("[v0] Staff session cookie:", token ? "present" : "missing")
  }

  if (!token) {
    console.log("[v0] No staff session cookie or token found")
    return null
  }

  try {
    // Check in-memory cache first for performance
    const cachedSession = staffSessionStore.get(token)
    if (cachedSession) {
      const now = Date.now()
      if (now <= cachedSession.expiresAt) {
        console.log("[v0] ✅ Staff session verified from cache:", cachedSession.name)
        return {
          authenticated: true,
          staffId: cachedSession.staffId,
          name: cachedSession.name,
          assignedProject: cachedSession.assignedProject,
        }
      } else {
        // Remove expired session from cache
        staffSessionStore.delete(token)
      }
    }

    // Check Supabase for persistent session
    console.log("[v0] Checking Supabase for session...")
    const { data: session, error } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", token)
      .single()

    if (error || !session) {
      console.log("[v0] Session not found in Supabase:", error?.message)
      return null
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)

    if (now > expiresAt) {
      console.log("[v0] Staff session expired, removing from Supabase")
      await supabase.from("staff_sessions").delete().eq("session_token", token)
      return null
    }

    // Update last accessed time
    await supabase.from("staff_sessions").update({ last_accessed_at: now.toISOString() }).eq("session_token", token)

    // Cache the session in memory for future requests
    staffSessionStore.set(token, {
      createdAt: new Date(session.created_at).getTime(),
      expiresAt: expiresAt.getTime(),
      staffId: session.staff_id,
      name: session.name,
      assignedProject: session.assigned_project,
    })

    console.log("[v0] ✅ Staff session verified from Supabase:", session.name)
    return {
      authenticated: true,
      staffId: session.staff_id,
      name: session.name,
      assignedProject: session.assigned_project,
    }
  } catch (error) {
    console.error("[v0] Staff session verification error:", error)
    return null
  }
}
