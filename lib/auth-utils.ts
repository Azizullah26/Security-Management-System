import type { NextRequest } from "next/server"
import { staffSessionStore } from "@/lib/session-store"

// Shared admin session store (deprecated - using Supabase now)
export const adminSessionStore = new Map<
  string,
  {
    createdAt: number
    expiresAt: number
  }
>()

// Direct admin verification using in-memory session store
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  console.log("[v0] Verifying admin session...")

  // Check Authorization header first (for token-based auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    console.log("[v0] Authorization header token:", token ? "present" : "missing")

    if (token) {
      const session = adminSessionStore.get(token)
      console.log("[v0] Session in store (from header):", session ? "found" : "not found")

      if (session) {
        const now = Date.now()
        if (now <= session.expiresAt) {
          console.log("[v0] ✅ Admin session verified successfully (from header)")
          return true
        } else {
          console.log("[v0] Session expired, removing from store")
          adminSessionStore.delete(token)
        }
      }
    }
  }

  // Fallback to cookie-based auth
  const adminSession = request.cookies.get("admin-session")?.value
  console.log("[v0] Admin session cookie:", adminSession ? "present" : "missing")

  if (!adminSession) {
    console.log("[v0] No admin session cookie or token found")
    return false
  }

  try {
    const session = adminSessionStore.get(adminSession)
    console.log("[v0] Session in store:", session ? "found" : "not found")

    if (!session) {
      console.log("[v0] Session not found in store")
      return false
    }

    const now = Date.now()
    console.log(
      "[v0] Session expiry check - now:",
      now,
      "expires:",
      session.expiresAt,
      "valid:",
      now <= session.expiresAt,
    )

    if (now > session.expiresAt) {
      console.log("[v0] Session expired, removing from store")
      adminSessionStore.delete(adminSession)
      return false
    }

    console.log("[v0] ✅ Admin session verified successfully")
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

  // Check Authorization header first (for token-based auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    console.log("[v0] Staff authorization header token:", token ? "present" : "missing")

    if (token) {
      const session = staffSessionStore.get(token)
      console.log("[v0] Staff session in store (from header):", session ? "found" : "not found")

      if (session) {
        const now = Date.now()
        if (now <= session.expiresAt) {
          console.log("[v0] ✅ Staff session verified successfully (from header):", session.name)
          return {
            authenticated: true,
            staffId: session.staffId,
            name: session.name,
            assignedProject: session.assignedProject,
          }
        } else {
          console.log("[v0] Staff session expired, removing from store")
          staffSessionStore.delete(token)
        }
      }
    }
  }

  // Check localStorage token (sent as header)
  const localStorageToken = request.headers.get("x-staff-session-token")
  if (localStorageToken) {
    console.log("[v0] Staff localStorage token:", localStorageToken ? "present" : "missing")
    const session = staffSessionStore.get(localStorageToken)
    console.log("[v0] Staff session in store (from localStorage):", session ? "found" : "not found")

    if (session) {
      const now = Date.now()
      if (now <= session.expiresAt) {
        console.log("[v0] ✅ Staff session verified successfully (from localStorage):", session.name)
        return {
          authenticated: true,
          staffId: session.staffId,
          name: session.name,
          assignedProject: session.assignedProject,
        }
      } else {
        console.log("[v0] Staff session expired, removing from store")
        staffSessionStore.delete(localStorageToken)
      }
    }
  }

  // Fallback to cookie-based auth
  const staffSession = request.cookies.get("staff-session")?.value
  console.log("[v0] Staff session cookie:", staffSession ? "present" : "missing")

  if (!staffSession) {
    console.log("[v0] No staff session cookie or token found")
    return null
  }

  try {
    const session = staffSessionStore.get(staffSession)
    console.log("[v0] Staff session in store (from cookie):", session ? "found" : "not found")

    if (!session) {
      console.log("[v0] Staff session not found in store")
      return null
    }

    const now = Date.now()
    console.log(
      "[v0] Staff session expiry check - now:",
      now,
      "expires:",
      session.expiresAt,
      "valid:",
      now <= session.expiresAt,
    )

    if (now > session.expiresAt) {
      console.log("[v0] Staff session expired, removing from store")
      staffSessionStore.delete(staffSession)
      return null
    }

    console.log("[v0] ✅ Staff session verified successfully (from cookie):", session.name)
    return {
      authenticated: true,
      staffId: session.staffId,
      name: session.name,
      assignedProject: session.assignedProject,
    }
  } catch (error) {
    console.error("[v0] Staff session verification error:", error)
    return null
  }
}
