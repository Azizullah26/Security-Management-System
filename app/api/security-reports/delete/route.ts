import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

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
