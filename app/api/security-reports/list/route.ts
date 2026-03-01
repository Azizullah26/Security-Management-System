import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: reports, error } = await supabase
      .from("securityreport")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching security reports:", error)
      return NextResponse.json({ error: "Failed to fetch security reports" }, { status: 500 })
    }

    console.log(`[v0] Successfully fetched ${reports?.length || 0} security reports`)

    return NextResponse.json(reports || [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[v0] Security reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
