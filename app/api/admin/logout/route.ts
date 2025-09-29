import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '../auth/route'

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin-session')
    
    // Remove session from server-side store
    if (sessionCookie && sessionCookie.value) {
      sessionStore.delete(sessionCookie.value)
    }
    
    const response = NextResponse.json({ success: true })
    
    // Clear the admin session cookie
    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}