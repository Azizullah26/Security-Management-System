import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const body = await request.json()
    const { staff_name, project_name, date, description, attachment } = body

    console.log("[v0] Creating security report:", {
      staff_name,
      project_name,
      date,
      description,
      attachmentCount: attachment?.length,
    })

    const { data, error } = await supabase
      .from("securityreport")
      .insert({
        staff_name,
        project_name,
        Date: date,
        description,
        attachment: JSON.stringify(attachment),
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to create security report", details: error.message }, { status: 500 })
    }

    console.log("[v0] Security report created successfully:", data)
    return NextResponse.json({ success: true, report: data[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating security report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("securityreport").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch security reports" }, { status: 500 })
    }

    return NextResponse.json({ reports: data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error fetching security reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
