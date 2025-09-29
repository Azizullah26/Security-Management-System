import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '../auth/route'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Verify session token exists and is not expired
    const session = sessionStore.get(sessionCookie.value)
    const now = Date.now()
    
    if (!session || now > session.expiresAt) {
      // Clean up expired session
      if (session) {
        sessionStore.delete(sessionCookie.value)
      }
      
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}