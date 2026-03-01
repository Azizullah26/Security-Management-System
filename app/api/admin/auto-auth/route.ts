import { type NextRequest, NextResponse } from "next/server"
import { staffSessionStore } from "@/lib/session-store"
import { adminSessionStore } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Auto-auth request received")

    const allCookies = request.cookies.getAll()
    console.log("[v0] All cookies received:", allCookies.map((c) => c.name).join(", "))

    // Check if user has a valid staff session
    const staffSessionCookie = request.cookies.get("staff-session")
    console.log("[v0] Staff session cookie:", staffSessionCookie ? "found" : "missing")

    if (staffSessionCookie) {
      console.log("[v0] Staff session cookie value:", staffSessionCookie.value.substring(0, 8) + "...")
    }

    if (!staffSessionCookie || !staffSessionCookie.value) {
      console.log("[v0] No staff session cookie found")
      return NextResponse.json({ error: "No staff session found" }, { status: 401 })
    }

    console.log("[v0] Checking staff session in store...")
    const staffSession = staffSessionStore.get(staffSessionCookie.value)
    console.log("[v0] Staff session found in store:", staffSession ? "yes" : "no")

    if (staffSession) {
      console.log("[v0] Staff session details - staffId:", staffSession.staffId, "name:", staffSession.name)
    }

    const now = Date.now()

    if (!staffSession || now > staffSession.expiresAt) {
      console.log("[v0] Staff session expired or invalid")
      if (staffSession) {
        console.log("[v0] Session expired at:", new Date(staffSession.expiresAt).toISOString())
        console.log("[v0] Current time:", new Date(now).toISOString())
      }
      return NextResponse.json({ error: "Staff session expired" }, { status: 401 })
    }

    // Check if the staff user is "Admin"
    if (staffSession.staffId !== "Admin") {
      console.log("[v0] Staff user is not Admin:", staffSession.staffId)
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    console.log("[v0] Admin user verified from staff session, creating admin session...")

    // Create admin session
    const sessionToken = generateSessionToken()
    const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours

    adminSessionStore.set(sessionToken, {
      createdAt: now,
      expiresAt: expiresAt,
    })

    console.log("[v0] Admin session created automatically for Admin user")
    console.log("[v0] Session token:", sessionToken.substring(0, 8) + "...")

    const response = NextResponse.json({
      success: true,
      message: "Admin session created",
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
