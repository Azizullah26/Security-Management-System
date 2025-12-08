import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Security Reports API: Starting fetch")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Security Reports API: Supabase URL:", supabaseUrl ? "Set" : "Missing")
    console.log("[v0] Security Reports API: Service Key:", supabaseServiceKey ? "Set" : "Missing")

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[v0] Security Reports API: Configuration missing")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("[v0] Security Reports API: Querying securityreport table")

    const { data: reports, error } = await supabase
      .from("securityreport")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Security Reports API: Database error:", error)
      return NextResponse.json({ error: "Failed to fetch security reports", details: error.message }, { status: 500 })
    }

    console.log("[v0] Security Reports API: Successfully fetched", reports?.length || 0, "reports")

    return NextResponse.json(reports || [])
  } catch (error) {
    console.error("[v0] Security Reports API: Caught exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
