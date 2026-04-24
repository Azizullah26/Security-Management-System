import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware auth checks for public auth endpoints
  if (pathname === "/api/admin/auth" || pathname === "/api/admin/verify" || pathname === "/api/admin/sso-login") {
    return NextResponse.next()
  }

  // Allow all GET requests from admin page (it handles auth client-side)
  if (pathname.startsWith("/api/admin/") && request.method === "GET") {
    return NextResponse.next()
  }

  // Allow unauthenticated access to fetch available projects (used during PM creation)
  if (pathname === "/api/admin/available-projects" && request.method === "GET") {
    return NextResponse.next()
  }

  // Allow public project fetch (GET only)
  if (pathname === "/api/projects" && request.method === "GET") {
    return NextResponse.next()
  }

  // Protect POST/DELETE/PUT requests to admin and projects APIs
  if (
    (pathname.startsWith("/api/admin/") && (request.method === "POST" || request.method === "DELETE" || request.method === "PUT")) ||
    (pathname.startsWith("/api/projects") && request.method !== "GET") ||
    (pathname.startsWith("/api/security-staff") && request.method !== "GET") ||
    (pathname.startsWith("/api/assignments") && request.method !== "GET")
  ) {
    // Check for Authorization header (token-based auth)
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      if (token) {
        return NextResponse.next()
      }
    }

    // Check for admin-session cookie
    const adminCookie = request.cookies.get("admin-session")
    if (adminCookie && adminCookie.value) {
      return NextResponse.next()
    }

    // No auth found
    console.log("[v0] Middleware: No auth found for protected route:", pathname)
    return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
