import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("staff-session")

    if (sessionCookie && sessionCookie.value) {
      const supabase = await createServiceRoleClient()
      await supabase.from("staff_sessions").delete().eq("session_token", sessionCookie.value)
      console.log("[v0] Staff session removed from database")
    }

    const response = NextResponse.json({ success: true })

    // Clear the staff session cookie
    response.cookies.set("staff-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Staff logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
