import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    console.log("[v0] Validating SSO token for admin login...")

    const supabase = await createServiceRoleClient()

    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .maybeSingle()

    if (sessionError) {
      console.error("[v0] Error checking admin session:", sessionError)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    if (!session) {
      console.log("[v0] Token not found in admin_sessions")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      console.log("[v0] Admin token has expired")
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 401 })
    }

    console.log("[v0] Admin authenticated via SSO")

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
