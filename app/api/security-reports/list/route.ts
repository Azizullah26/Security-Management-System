import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Security Reports API: Starting fetch at", new Date().toISOString())

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Security Reports API: Supabase URL:", supabaseUrl ? "Set" : "Missing")
    console.log(
      "[v0] Security Reports API: Service Key:",
      supabaseServiceKey ? "Set (length: " + supabaseServiceKey?.length + ")" : "Missing",
    )

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[v0] Security Reports API: Configuration missing")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    })

    console.log("[v0] Security Reports API: Querying securityreport table with service role")

    const {
      data: reports,
      error,
      count,
    } = await supabase.from("securityreport").select("*", { count: "exact" }).order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Security Reports API: Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json(
        {
          error: "Failed to fetch security reports",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Security Reports API: Database returned", reports?.length || 0, "reports")
    console.log("[v0] Security Reports API: Total count from database:", count)
    console.log("[v0] Security Reports API: Report IDs:", reports?.map((r) => r.id).join(", "))

    reports?.forEach((report, index) => {
      console.log(`[v0] Security Reports API: Report ${index + 1}:`, {
        id: report.id,
        staff_name: report.staff_name,
        date: report.Date,
        created_at: report.created_at,
        has_attachment: !!report.attachment,
      })
    })

    return NextResponse.json(reports || [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[v0] Security Reports API: Caught exception:", error)
    console.error("[v0] Security Reports API: Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
