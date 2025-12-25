import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("staff-session")

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: session, error } = await supabase
      .from("staff_sessions")
      .select("*, security_staff!inner(file_id, full_name, assigned_project)")
      .eq("session_token", sessionCookie.value)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 })
    }

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      await supabase.from("staff_sessions").delete().eq("session_token", sessionCookie.value)
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      staff: {
        fileId: session.file_id,
        name: session.name,
        assignedProject: session.assigned_project,
      },
    })
  } catch (error) {
    console.error("[v0] Staff verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("session_token", token)
      .single()

    if (error || !session) {
      console.log("[v0] Staff session not found for token:", token?.substring(0, 10))
      return NextResponse.json({ error: "Session not found" }, { status: 401 })
    }

    const now = Date.now()
    if (session.expires_at && session.expires_at < now) {
      console.log("[v0] Staff session expired. Expires:", session.expires_at, "Now:", now)
      await supabase.from("staff_sessions").delete().eq("session_token", token)
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      staff: {
        fileId: session.file_id,
        name: session.name,
        assignedProject: session.assigned_project,
      },
    })
  } catch (error) {
    console.error("[v0] Staff verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
