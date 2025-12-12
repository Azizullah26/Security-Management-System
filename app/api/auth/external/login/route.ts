import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

// External authentication endpoint for third-party integrations (RCC HUB)
export async function POST(request: NextRequest) {
  try {
    const { username, password, source } = await request.json()

    console.log("[v0] External login attempt - Username:", username, "Source:", source)

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    if (username.toLowerCase() === "admin") {
      if (password === process.env.ADMIN_PASSWORD) {
        const sessionToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours in milliseconds

        const { error: sessionError } = await supabase.from("admin_sessions").insert({
          session_token: sessionToken,
          created_at: Date.now(),
          expires_at: expiresAt,
        })

        if (sessionError) {
          console.error("[v0] Admin session creation error:", sessionError)
          return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
        }

        console.log("[v0] Admin login successful, token:", sessionToken.substring(0, 8) + "...")
        return NextResponse.json(
          {
            success: true,
            user: {
              id: "admin",
              username: "admin",
              role: "admin",
              name: "Administrator",
            },
            token: sessionToken,
            expiresAt: new Date(expiresAt).toISOString(),
            dashboardUrl: `/admin?token=${sessionToken}`,
          },
          { headers: getCorsHeaders() },
        )
      } else {
        console.log("[v0] Admin password mismatch")
      }
    }

    const staffPasswordEnvKey = `STAFF_${username.toUpperCase()}_PASSWORD`
    const staffPassword = process.env[staffPasswordEnvKey]

    if (staffPassword && password === staffPassword) {
      // Get staff details from database
      const { data: staffData, error: staffError } = await supabase
        .from("securitystaff")
        .select("*")
        .eq("file_id", username)
        .single()

      if (staffError || !staffData) {
        console.error("[v0] Staff lookup error:", staffError)
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401, headers: getCorsHeaders() },
        )
      }

      const sessionToken = crypto.randomBytes(32).toString("hex")
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000

      const { error: sessionError } = await supabase.from("staff_sessions").insert({
        staff_id: staffData.file_id,
        name: staffData.name,
        session_token: sessionToken,
        assigned_project: staffData.assigned_project,
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

      console.log("[v0] Staff login successful:", staffData.name)
      return NextResponse.json(
        {
          success: true,
          user: {
            id: staffData.file_id,
            username: staffData.file_id,
            role: "staff",
            name: staffData.name,
            assignedProject: staffData.assigned_project,
          },
          token: sessionToken,
          expiresAt: new Date(expiresAt).toISOString(),
          dashboardUrl: `/?token=${sessionToken}`,
        },
        { headers: getCorsHeaders() },
      )
    }

    // Invalid credentials
    console.log("[v0] Invalid credentials for username:", username)
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401, headers: getCorsHeaders() },
    )
  } catch (error) {
    console.error("[v0] External login error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: getCorsHeaders() },
    )
  }
}

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://elracehub.vercel.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() })
}
