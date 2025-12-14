import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 })
    }

    console.log("[v0] Admin SSO Login: Verifying external token...")

    const supabase = await createServiceRoleClient()
    const now = Date.now()

    // Verify token exists in admin_sessions and is not expired
    const { data: adminSession } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .gt("expires_at", now)
      .maybeSingle()

    if (!adminSession) {
      console.log("[v0] Invalid or expired admin token")
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    console.log("[v0] Admin token verified, creating session cookie...")

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        role: "admin",
        username: "admin",
      },
    })
  } catch (error) {
    console.error("[v0] Admin SSO login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
