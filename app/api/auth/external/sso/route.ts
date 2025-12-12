import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Allow all origins for Hub integration
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

// Generate SSO session for Hub users
export async function POST(request: NextRequest) {
  try {
    const { email, hubToken } = await request.json()

    console.log("[v0] SSO login request for email:", email)

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400, headers: getCorsHeaders() },
      )
    }

    const supabase = await createServiceRoleClient()

    // Verify user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, full_name, file_id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (profileError) {
      console.log("[v0] Profile lookup error:", profileError)
    }

    let userInfo = null
    let userRole = "staff"

    if (profile) {
      userInfo = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        fileId: profile.file_id,
      }
      userRole = profile.role || "staff"
    } else {
      // Check securitystaff table
      const { data: legacyStaff } = await supabase
        .from("securitystaff")
        .select("file_id, name, email")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      if (legacyStaff) {
        userInfo = {
          id: legacyStaff.file_id,
          email: legacyStaff.email,
          role: "staff",
          fullName: legacyStaff.name,
          fileId: legacyStaff.file_id,
        }
      }
    }

    if (!userInfo) {
      console.log("[v0] SSO rejected - user not found:", email)
      return NextResponse.json(
        { success: false, error: "User not found. Access denied." },
        { status: 403, headers: getCorsHeaders() },
      )
    }

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    // Determine redirect based on role
    let redirectPath = "/"
    if (userRole === "admin") {
      // Create admin session
      await supabase.from("admin_sessions").insert({
        session_token: sessionToken,
        created_at: Date.now(),
        expires_at: expiresAt,
      })
      redirectPath = "/admin"
    } else {
      // Create staff session
      await supabase.from("staff_sessions").insert({
        session_token: sessionToken,
        staff_id: userInfo.fileId || userInfo.id,
        name: userInfo.fullName,
        assigned_project: null,
        created_at: Date.now(),
        expires_at: expiresAt,
      })
      redirectPath = "/"
    }

    const baseUrl = "https://elracesecurity.vercel.app"
    const redirectUrl = `${baseUrl}${redirectPath}?token=${sessionToken}`

    console.log("[v0] SSO session created for:", email, "Role:", userRole)

    return NextResponse.json(
      {
        success: true,
        token: sessionToken,
        user: userInfo,
        redirectUrl,
        expiresAt: new Date(expiresAt).toISOString(),
      },
      { headers: getCorsHeaders() },
    )
  } catch (error) {
    console.error("[v0] SSO error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: getCorsHeaders() },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() })
}
