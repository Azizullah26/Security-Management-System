import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] Security Reports Delete API: Starting delete request")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Security Reports Delete API: Missing Supabase configuration")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    // Get report ID from request
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("id")

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    console.log("[v0] Security Reports Delete API: Deleting report ID:", reportId)

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Delete the report
    const { error } = await supabase.from("securityreport").delete().eq("id", reportId)

    if (error) {
      console.error("[v0] Security Reports Delete API: Delete error:", error)
      return NextResponse.json({ error: "Failed to delete report", details: error.message }, { status: 500 })
    }

    console.log("[v0] Security Reports Delete API: Report deleted successfully")

    return NextResponse.json({ success: true, message: "Report deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Security Reports Delete API: Caught error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
