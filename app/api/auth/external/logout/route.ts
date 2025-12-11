import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

// Logout and invalidate external session token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    // Delete from admin sessions
    await supabase.from("admin_sessions").delete().eq("session_token", token)

    // Delete from staff sessions
    await supabase.from("staff_sessions").delete().eq("session_token", token)

    return NextResponse.json({
      success: true,
      message: "Session invalidated successfully",
    })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
