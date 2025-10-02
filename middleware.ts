import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for public routes
  if (pathname === '/api/admin/auth' || pathname === '/api/admin/verify') {
    return NextResponse.next()
  }

  // Allow GET requests to projects (admin page handles auth client-side)
  if (pathname.startsWith('/api/projects') && request.method === 'GET') {
    return NextResponse.next()
  }

  // Protect admin API routes and sensitive endpoints
  if (pathname.startsWith('/api/projects') || 
      pathname.startsWith('/api/security-staff') ||
      pathname.startsWith('/api/admin/')) {
    
    const authCookie = request.cookies.get('admin-session')
    
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
    
    // Note: Full session validation would require importing sessionStore
    // For middleware, we do basic cookie presence check
    // Full validation happens in individual route handlers
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/projects', '/api/security-staff']
}