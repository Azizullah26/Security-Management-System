import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    console.log("[v0] Staff SSO: Validating token:", token.substring(0, 20) + "...")

    const supabase = await createServiceRoleClient()

    const { data: session, error: sessionError } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", token)
      .maybeSingle()

    console.log("[v0] Staff SSO: Session query result:", { session, error: sessionError })

    if (sessionError) {
      console.error("[v0] Staff SSO: Error checking session:", sessionError)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (!session) {
      console.log("[v0] Staff SSO: Token not found in staff_sessions table")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("[v0] Staff SSO: Session found:", session)

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      console.log("[v0] Staff SSO: Token expired. Expires:", session.expires_at, "Now:", now)
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 401 })
    }

    const { data: staff, error: staffError } = await supabase
      .from("security_staff")
      .select("id, file_id, full_name, position")
      .eq("file_id", session.file_id)
      .maybeSingle()

    console.log("[v0] Staff SSO: Staff lookup result:", { staff, error: staffError })

    if (staffError || !staff) {
      console.error("[v0] Staff SSO: Staff not found:", staffError)
      return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 })
    }

    console.log("[v0] Staff SSO: Successfully authenticated:", staff.full_name)

    return NextResponse.json({
      success: true,
      sessionToken: token,
      user: {
        id: staff.id,
        fileId: staff.file_id,
        file_id: staff.file_id,
        name: staff.full_name,
        fullname: staff.full_name,
        role: "staff",
        position: staff.position,
      },
    })
  } catch (error) {
    console.error("[v0] Staff SSO login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
