import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Allow all origins for Hub integration
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

// Check if user email has access to security system
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log("[v0] Check access request for email:", email)

    if (!email) {
      return NextResponse.json(
        { success: false, hasAccess: false, error: "Email is required" },
        { status: 400, headers: getCorsHeaders() },
      )
    }

    const supabase = await createServiceRoleClient()

    // Check profiles table for user with this email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, full_name, file_id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (profileError) {
      console.log("[v0] Profile lookup error:", profileError)
    }

    if (profile) {
      console.log("[v0] User found in profiles:", profile.email, "Role:", profile.role)
      return NextResponse.json(
        {
          success: true,
          hasAccess: true,
          user: {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            fullName: profile.full_name,
            fileId: profile.file_id,
          },
        },
        { headers: getCorsHeaders() },
      )
    }

    // Also check security_staff table by email (if they have one)
    const { data: securityStaff, error: staffError } = await supabase
      .from("security_staff")
      .select("id, file_id, full_name, position")
      .maybeSingle()

    if (staffError) {
      console.log("[v0] Security staff lookup error:", staffError)
    }

    // Check securitystaff table (legacy)
    const { data: legacyStaff } = await supabase
      .from("securitystaff")
      .select("file_id, name, email")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (legacyStaff) {
      console.log("[v0] User found in securitystaff:", legacyStaff.email)
      return NextResponse.json(
        {
          success: true,
          hasAccess: true,
          user: {
            id: legacyStaff.file_id,
            email: legacyStaff.email,
            role: "staff",
            fullName: legacyStaff.name,
            fileId: legacyStaff.file_id,
          },
        },
        { headers: getCorsHeaders() },
      )
    }

    // User not found - no access
    console.log("[v0] User not found for email:", email)
    return NextResponse.json(
      {
        success: true,
        hasAccess: false,
        user: null,
      },
      { headers: getCorsHeaders() },
    )
  } catch (error) {
    console.error("[v0] Check access error:", error)
    return NextResponse.json(
      { success: false, hasAccess: false, error: "Internal server error" },
      { status: 500, headers: getCorsHeaders() },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() })
}
