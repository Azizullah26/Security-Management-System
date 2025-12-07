import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: reports, error } = await supabase
      .from("securityreport")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching security reports:", error)
      return NextResponse.json({ error: "Failed to fetch security reports" }, { status: 500 })
    }

    return NextResponse.json(reports || [])
  } catch (error) {
    console.error("Security reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
