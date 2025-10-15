import { type NextRequest, NextResponse } from "next/server"
import { adminSessionStore } from "@/lib/auth-utils"

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number; lockUntil?: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const WINDOW_DURATION = 5 * 60 * 1000 // 5 minutes

function getRateLimitKey(ip: string): string {
  return `auth_${ip}`
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip)
  const data = rateLimitMap.get(key)

  if (!data) return false

  const now = Date.now()

  // Check if still locked out
  if (data.lockUntil && now < data.lockUntil) {
    return true
  }

  // Reset if window expired
  if (now - data.lastAttempt > WINDOW_DURATION) {
    rateLimitMap.delete(key)
    return false
  }

  return data.attempts >= MAX_ATTEMPTS
}

function recordAttempt(ip: string, success: boolean) {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const data = rateLimitMap.get(key) || { attempts: 0, lastAttempt: now }

  if (success) {
    // Clear on successful auth
    rateLimitMap.delete(key)
    return
  }

  data.attempts += 1
  data.lastAttempt = now

  // Lock if too many attempts
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockUntil = now + LOCKOUT_DURATION
  }

  rateLimitMap.set(key, data)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Admin auth request received")

    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    // Check rate limiting
    if (isRateLimited(ip)) {
      console.log("[v0] Rate limit exceeded for IP:", ip)
      return NextResponse.json({ error: "Too many failed attempts. Please try again later." }, { status: 429 })
    }

    const { password } = await request.json()
    console.log("[v0] Password received, validating...")

    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error("[v0] ADMIN_PASSWORD environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const isValidPassword = timingSafeEqual(password, adminPassword)

    if (isValidPassword) {
      console.log("[v0] Password valid, creating session...")
      recordAttempt(ip, true)

      const sessionToken = generateSessionToken()
      const now = Date.now()
      const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours

      adminSessionStore.set(sessionToken, {
        createdAt: now,
        expiresAt: expiresAt,
      })
      console.log("[v0] Session stored successfully in memory")
      console.log("[v0] Session token:", sessionToken.substring(0, 10) + "...")
      console.log("[v0] Total sessions in store:", adminSessionStore.size)

      const response = NextResponse.json({
        success: true,
        token: sessionToken, // Send token to client
      })

      // Still set cookie as fallback
      const isProduction = process.env.NODE_ENV === "production"
      const cookieValue = `admin-session=${sessionToken}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=${isProduction ? "Strict" : "Lax"}${isProduction ? "; Secure" : ""}`

      response.headers.set("Set-Cookie", cookieValue)

      console.log("[v0] Cookie header set:", cookieValue)
      console.log("[v0] Admin authentication successful")
      return response
    } else {
      console.log("[v0] Invalid password attempt")
      recordAttempt(ip, false)

      // Add delay for failed attempts
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("[v0] Admin auth error:", error)
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 })
  }
}
