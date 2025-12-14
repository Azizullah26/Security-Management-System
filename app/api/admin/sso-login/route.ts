import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      console.log("[v0] SSO token missing")
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    console.log("[v0] Admin SSO: Validating token:", token.substring(0, 20) + "...")

    const supabase = await createServiceRoleClient()

    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .maybeSingle()

    if (sessionError) {
      console.error("[v0] Admin SSO: Error querying admin_sessions:", sessionError)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (!session) {
      console.log("[v0] Admin SSO: Token not found in admin_sessions table")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] Admin SSO: Session found, expires_at:", session.expires_at)

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      console.log("[v0] Admin SSO: Token expired. Expires:", session.expires_at, "Now:", now)
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 401 })
    }

    console.log("[v0] Admin SSO: Token valid! Creating authenticated response")

    const response = NextResponse.json({
      success: true,
      sessionToken: token,
      user: {
        id: "admin",
        fileId: "Admin",
        name: "Administrator",
        role: "admin",
      },
    })

    response.cookies.set("admin-session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Admin SSO login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "https://elracehub.vercel.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
