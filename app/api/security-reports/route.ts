import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const body = await request.json()
    const { staff_name, date, description, attachment } = body

    console.log("[v0] Creating security report:", {
      staff_name,
      date,
      description,
      attachmentCount: attachment?.length,
    })

    // Insert the security report into the database
    const { data, error } = await supabase
      .from("securityreport")
      .insert({
        staff_name,
        Date: date,
        description,
        attachment: JSON.stringify(attachment), // Store array of URLs as JSON string
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
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

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
