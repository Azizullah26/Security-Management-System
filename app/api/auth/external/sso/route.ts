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

export async function POST(request: NextRequest) {
  try {
    const { file_id, password, source } = await request.json()

    console.log("[v0] SSO login request for file_id:", file_id, "source:", source)

    if (!file_id || !password) {
      return NextResponse.json(
        { success: false, error: "file_id and password are required" },
        { status: 400, headers: getCorsHeaders() },
      )
    }

    const supabase = await createServiceRoleClient()

    // Check if admin login
    if (file_id.toLowerCase() === "admin") {
      console.log("[v0] Admin SSO login attempt")

      if (password !== process.env.ADMIN_PASSWORD) {
        console.log("[v0] Admin password mismatch")
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401, headers: getCorsHeaders() },
        )
      }

      // Generate admin session token
      const sessionToken = crypto.randomBytes(32).toString("hex")
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

      const { error: sessionError } = await supabase.from("admin_sessions").insert({
        session_token: sessionToken,
        created_at: Date.now(),
        expires_at: expiresAt,
      })

      if (sessionError) {
        console.error("[v0] Admin session creation error:", sessionError)
        return NextResponse.json(
          { success: false, error: "Failed to create session" },
          { status: 500, headers: getCorsHeaders() },
        )
      }

      const baseUrl = "https://elracesecurity.vercel.app"
      const redirectUrl = `${baseUrl}/admin?token=${sessionToken}`

      console.log("[v0] Admin SSO session created successfully")

      return NextResponse.json(
        {
          success: true,
          token: sessionToken,
          user: {
            file_id: "Admin",
            role: "admin",
            fullName: "Administrator",
          },
          redirectUrl,
          expiresAt: new Date(expiresAt).toISOString(),
        },
        { headers: getCorsHeaders() },
      )
    }

    // Check security_staff table for staff login
    const { data: staff, error: staffError } = await supabase
      .from("security_staff")
      .select("id, file_id, full_name, current_password, position")
      .eq("file_id", file_id)
      .maybeSingle()

    if (staffError) {
      console.error("[v0] Staff lookup error:", staffError)
    }

    if (!staff) {
      console.log("[v0] Staff not found with file_id:", file_id)
      return NextResponse.json(
        { success: false, error: "User not found. Access denied." },
        { status: 403, headers: getCorsHeaders() },
      )
    }

    // Verify password
    if (staff.current_password !== password) {
      console.log("[v0] Staff password mismatch for file_id:", file_id)
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401, headers: getCorsHeaders() },
      )
    }

    // Generate staff session token
    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const { error: sessionError } = await supabase.from("staff_sessions").insert({
      session_token: sessionToken,
      staff_id: staff.file_id,
      name: staff.full_name,
      assigned_project: null,
      created_at: Date.now(),
      expires_at: expiresAt,
    })

    if (sessionError) {
      console.error("[v0] Staff session creation error:", sessionError)
      return NextResponse.json(
        { success: false, error: "Failed to create session" },
        { status: 500, headers: getCorsHeaders() },
      )
    }

    const baseUrl = "https://elracesecurity.vercel.app"
    const redirectUrl = `${baseUrl}/?token=${sessionToken}`

    console.log("[v0] Staff SSO session created for:", staff.full_name)

    return NextResponse.json(
      {
        success: true,
        token: sessionToken,
        user: {
          file_id: staff.file_id,
          role: "staff",
          fullName: staff.full_name,
          position: staff.position,
        },
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
