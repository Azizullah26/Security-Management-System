import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    console.log("[v0] Validating SSO token for staff login...")

    const supabase = await createServiceRoleClient()

    const { data: session, error: sessionError } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", token)
      .maybeSingle()

    if (sessionError) {
      console.error("[v0] Error checking session:", sessionError)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    if (!session) {
      console.log("[v0] Token not found in staff_sessions")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      console.log("[v0] Token has expired")
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 401 })
    }

    const { data: staff, error: staffError } = await supabase
      .from("security_staff")
      .select("*")
      .eq("file_id", session.file_id)
      .single()

    if (staffError || !staff) {
      console.error("[v0] Staff not found:", staffError)
      return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 })
    }

    console.log("[v0] Staff authenticated via SSO:", staff.file_id)

    return NextResponse.json({
      success: true,
      sessionToken: token,
      user: {
        id: staff.uuid,
        fileId: staff.file_id,
        name: staff.name,
        role: "staff",
        assignedProject: staff.assigned_project || "",
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
        "Access-Control-Allow-Origin": "https://elracehub.vercel.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}
