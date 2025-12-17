import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    console.log("[v0] DELETE /api/security-reports/delete - Deleting report:", id)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Supabase configuration missing")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from("securityreport").delete().eq("id", Number.parseInt(id))

    if (error) {
      console.error("[v0] Error deleting security report:", error)
      return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
    }

    console.log("[v0] Successfully deleted security report:", id)

    return NextResponse.json({ success: true, message: "Report deleted successfully" })
  } catch (error) {
    console.error("[v0] Error in delete security report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
