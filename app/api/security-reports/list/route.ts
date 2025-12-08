import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession, verifyStaffSession } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/security-reports/list - Fetching security reports")

    const isAdmin = await verifyAdminSession(request)
    const staffSession = await verifyStaffSession(request)

    if (!isAdmin && !staffSession) {
      console.log("[v0] Unauthorized access to security reports")
      return NextResponse.json(
        {
          error: "Unauthorized - Please log in to view security reports",
        },
        { status: 401 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Supabase configuration missing")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("[v0] Fetching all security reports from database...")
    const { data: reports, error } = await supabase
      .from("securityreport")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching security reports:", error)
      return NextResponse.json({ error: "Failed to fetch security reports", details: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", reports?.length || 0, "security reports")
    return NextResponse.json(reports || [])
  } catch (error) {
    console.error("[v0] Security reports API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
