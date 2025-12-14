import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 })
    }

    console.log("[v0] SSO Login: Verifying external token...")

    const supabase = await createServiceRoleClient()

    // Check if token exists in admin_sessions or staff_sessions
    const now = Date.now()

    // Try admin_sessions first
    const { data: adminSession } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .gt("expires_at", now)
      .maybeSingle()

    if (adminSession) {
      console.log("[v0] Valid admin token found")
      return NextResponse.json({
        success: true,
        user: {
          role: "admin",
          fileId: "Admin",
          name: "Administrator",
          id: "Admin",
        },
        sessionToken: token,
      })
    }

    // Try staff_sessions
    const { data: staffSession } = await supabase
      .from("staff_sessions")
      .select("*, security_staff(*)")
      .eq("session_token", token)
      .gt("expires_at", now)
      .maybeSingle()

    if (staffSession && staffSession.security_staff) {
      console.log("[v0] Valid staff token found for:", staffSession.security_staff.name)
      return NextResponse.json({
        success: true,
        user: {
          role: "staff",
          fileId: staffSession.security_staff.file_id,
          name: staffSession.security_staff.name,
          assignedProject: staffSession.assigned_project || "",
          id: staffSession.security_staff.file_id,
        },
        sessionToken: token,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
  } catch (error) {
    console.error("[v0] SSO login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
