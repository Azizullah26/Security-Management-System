import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

// External authentication endpoint for third-party integrations (RCC HUB)
export async function POST(request: NextRequest) {
  try {
    const { username, password, source } = await request.json()

    console.log("[v0] ===== External Login Debug =====")
    console.log("[v0] Received username:", username)
    console.log("[v0] Username type:", typeof username)
    console.log("[v0] Username length:", username?.length)
    console.log("[v0] Username lowercase:", username?.toLowerCase())
    console.log("[v0] Received password length:", password?.length)
    console.log("[v0] Password first 4 chars:", password ? password.substring(0, 4) : "none")
    console.log("[v0] Source:", source)
    console.log("[v0] ADMIN_PASSWORD exists:", !!process.env.ADMIN_PASSWORD)
    console.log("[v0] ADMIN_PASSWORD length:", process.env.ADMIN_PASSWORD?.length)
    console.log("[v0] ADMIN_PASSWORD first 4 chars:", process.env.ADMIN_PASSWORD?.substring(0, 4))
    console.log("[v0] Passwords match:", password === process.env.ADMIN_PASSWORD)
    console.log("[v0] Username is 'admin':", username?.toLowerCase() === "admin")
    console.log("[v0] ================================")

    if (!username || !password) {
      console.log("[v0] Missing credentials")
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    if (username.toLowerCase() === "admin") {
      console.log("[v0] Admin login path taken")

      if (password === process.env.ADMIN_PASSWORD) {
        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store admin session
        const { error: sessionError } = await supabase.from("admin_sessions").insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          source: source || "external_hub",
        })

        if (sessionError) {
          console.error("[v0] Admin session creation error:", sessionError)
          return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
        }

        console.log("[v0] Admin login SUCCESSFUL, token generated")
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
            expiresAt: expiresAt.toISOString(),
            dashboardUrl: `/admin?token=${sessionToken}`,
          },
          { headers: getCorsHeaders() },
        )
      } else {
        console.log("[v0] Admin password MISMATCH")
        console.log("[v0] Expected:", process.env.ADMIN_PASSWORD)
        console.log("[v0] Received:", password)
      }
    } else {
      console.log("[v0] Not admin, checking staff credentials")
    }

    // Check if it's a staff member
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

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store staff session with assigned project
      const { error: sessionError } = await supabase.from("staff_sessions").insert({
        staff_id: staffData.file_id,
        session_token: sessionToken,
        assigned_project: staffData.assigned_project,
        expires_at: expiresAt.toISOString(),
        source: source || "external_hub",
      })

      if (sessionError) {
        console.error("[v0] Staff session creation error:", sessionError)
        return NextResponse.json(
          { success: false, error: "Failed to create session" },
          { status: 500, headers: getCorsHeaders() },
        )
      }

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
          expiresAt: expiresAt.toISOString(),
          dashboardUrl: `/?token=${sessionToken}`,
        },
        { headers: getCorsHeaders() },
      )
    }

    // Invalid credentials
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
