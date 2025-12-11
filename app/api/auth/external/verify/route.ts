import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://elracehub.vercel.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

// Verify external session token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400, headers: getCorsHeaders() },
      ) // Added CORS headers
    }

    const supabase = await createServiceRoleClient()

    // Check admin session
    const { data: adminSession, error: adminError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (!adminError && adminSession) {
      return NextResponse.json(
        {
          success: true,
          valid: true,
          user: {
            id: "admin",
            username: "admin",
            role: "admin",
            name: "Administrator",
          },
          expiresAt: adminSession.expires_at,
        },
        { headers: getCorsHeaders() },
      ) // Added CORS headers
    }

    // Check staff session
    const { data: staffSession, error: staffError } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (!staffError && staffSession) {
      // Get staff details
      const { data: staffData } = await supabase
        .from("securitystaff")
        .select("*")
        .eq("file_id", staffSession.staff_id)
        .single()

      return NextResponse.json(
        {
          success: true,
          valid: true,
          user: {
            id: staffSession.staff_id,
            username: staffSession.staff_id,
            role: "staff",
            name: staffData?.name || staffSession.staff_id,
            assignedProject: staffSession.assigned_project,
          },
          expiresAt: staffSession.expires_at,
        },
        { headers: getCorsHeaders() },
      ) // Added CORS headers
    }

    // Token not found or expired
    return NextResponse.json(
      { success: true, valid: false, error: "Invalid or expired token" },
      { headers: getCorsHeaders() },
    ) // Added CORS headers
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: getCorsHeaders() },
    ) // Added CORS headers
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() })
}
