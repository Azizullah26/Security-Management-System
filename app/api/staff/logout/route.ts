import { type NextRequest, NextResponse } from "next/server"
import { staffSessionStore } from "@/lib/session-store"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("staff-session")

    // Remove session from server-side store
    if (sessionCookie && sessionCookie.value) {
      staffSessionStore.delete(sessionCookie.value)
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
