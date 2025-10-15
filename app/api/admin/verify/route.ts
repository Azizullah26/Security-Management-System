import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession(request)

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error("[v0] Verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
