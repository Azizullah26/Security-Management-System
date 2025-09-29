import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { adminSessionStore } from '@/lib/auth-utils'

// Use shared admin session store

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

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      )
    }
    
    const { password } = await request.json()
    
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Constant-time comparison to prevent timing attacks
    const maxLength = Math.max(password.length, adminPassword.length)
    const paddedPassword = password.padEnd(maxLength, '\0')
    const paddedAdminPassword = adminPassword.padEnd(maxLength, '\0')
    
    const isValidPassword = crypto.timingSafeEqual(
      Buffer.from(paddedPassword, 'utf8'),
      Buffer.from(paddedAdminPassword, 'utf8')
    )
    
    if (isValidPassword) {
      recordAttempt(ip, true)
      
      // Generate session token and store server-side
      const sessionToken = crypto.randomBytes(32).toString('hex')
      const now = Date.now()
      const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours
      
      // Store session server-side
      adminSessionStore.set(sessionToken, {
        createdAt: now,
        expiresAt: expiresAt
      })
      
      const response = NextResponse.json({ success: true })
      
      // Set secure HTTP-only cookie
      response.cookies.set('admin-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(expiresAt),
        path: '/'
      })
      
      return response
    } else {
      recordAttempt(ip, false)
      
      // Add delay for failed attempts
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}