import { type NextRequest, NextResponse } from "next/server"
import { staffSessionStore } from "@/lib/session-store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("staff-session")

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify session token exists and is not expired
    const session = staffSessionStore.get(sessionCookie.value)
    const now = Date.now()

    if (!session || now > session.expiresAt) {
      // Clean up expired session
      if (session) {
        staffSessionStore.delete(sessionCookie.value)
      }

      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      staff: {
        fileId: session.staffId,
        name: session.name,
        assignedProject: session.assignedProject,
      },
    })
  } catch (error) {
    console.error("Staff verification error:", error)
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

    // Verify session token exists and is not expired
    const session = staffSessionStore.get(token)
    const now = Date.now()

    if (!session || now > session.expiresAt) {
      // Clean up expired session
      if (session) {
        staffSessionStore.delete(token)
      }

      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      staff: {
        fileId: session.staffId,
        name: session.name,
        assignedProject: session.assignedProject,
      },
    })
  } catch (error) {
    console.error("Staff verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
