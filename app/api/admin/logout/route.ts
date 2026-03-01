import { type NextRequest, NextResponse } from "next/server"
import { adminSessionStore } from "@/lib/auth-utils"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    let token: string | null = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    if (!token) {
      token = request.cookies.get("admin-session")?.value || null
    }

    if (token) {
      try {
        const supabase = getSupabaseClient()
        await supabase.from("admin_sessions").delete().eq("session_token", token)
        console.log("[v0] Admin session deleted from database")
      } catch (dbError) {
        console.error("[v0] Failed to delete session from database:", dbError)
      }

      // Also remove from in-memory store (for backwards compatibility)
      adminSessionStore.delete(token)
    }

    const response = NextResponse.json({ success: true })

    // Clear the admin session cookie
    response.cookies.set("admin-session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0), // Expire immediately
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
