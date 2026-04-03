import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const allReports: any[] = []
    let pageStart = 0
    const pageSize = 1000

    // Fetch all reports using pagination to bypass Supabase's default limit
    while (true) {
      const { data: reports, error } = await supabase
        .from("securityreport")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageStart, pageStart + pageSize - 1)

      if (error) {
        console.error("[v0] Error fetching security reports:", error)
        return NextResponse.json({ error: "Failed to fetch security reports" }, { status: 500 })
      }

      if (!reports || reports.length === 0) {
        break
      }

      allReports.push(...reports)

      // If we got fewer records than the page size, we've reached the end
      if (reports.length < pageSize) {
        break
      }

      pageStart += pageSize
    }

    console.log(`[v0] Successfully fetched ${allReports.length} security reports (total)`)

    return NextResponse.json(allReports, {
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
