import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

// Staff credentials (passwords should be in environment variables in production)
// For demo purposes, using predictable passwords - in production use bcrypt/Argon2
const staffCredentials = [
  { fileId: '3252', name: 'Mohus', password: process.env.STAFF_3252_PASSWORD || 'Mohus' },
  { fileId: '3242', name: 'Umair', password: process.env.STAFF_3242_PASSWORD || 'Umair' },
  { fileId: '3253', name: 'Salman', password: process.env.STAFF_3253_PASSWORD || 'Salman' },
  { fileId: '2234', name: 'Tanweer', password: process.env.STAFF_2234_PASSWORD || 'Tanweer' },
  { fileId: '3245', name: 'Tilak', password: process.env.STAFF_3245_PASSWORD || 'Tilak' },
  { fileId: '3248', name: 'Ramesh', password: process.env.STAFF_3248_PASSWORD || 'Ramesh' },
]

// Session storage for staff (in production, use Redis or database)
export const staffSessionStore = new Map<string, { 
  staffId: string
  name: string
  assignedProject: string | null
  createdAt: number
  expiresAt: number 
}>()

// Rate limiting map
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number; lockUntil?: number }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const WINDOW_DURATION = 5 * 60 * 1000 // 5 minutes

function getRateLimitKey(ip: string): string {
  return `staff_auth_${ip}`
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip)
  const data = rateLimitMap.get(key)
  
  if (!data) return false
  
  const now = Date.now()
  
  if (data.lockUntil && now < data.lockUntil) {
    return true
  }
  
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
    rateLimitMap.delete(key)
    return
  }
  
  data.attempts += 1
  data.lastAttempt = now
  
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockUntil = now + LOCKOUT_DURATION
  }
  
  rateLimitMap.set(key, data)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      )
    }
    
    const { fileId, password } = await request.json()
    
    // Find staff member by File ID
    const staff = staffCredentials.find(s => s.fileId === fileId)
    
    if (!staff) {
      recordAttempt(ip, false)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Invalid File ID or Password' },
        { status: 401 }
      )
    }
    
    // Use constant-time comparison to prevent timing attacks
    // Pad both strings to same length to prevent length-based timing attacks
    const maxLength = Math.max(password.length, staff.password.length)
    const paddedPassword = password.padEnd(maxLength, '\0')
    const paddedStaffPassword = staff.password.padEnd(maxLength, '\0')
    
    const isValidPassword = crypto.timingSafeEqual(
      Buffer.from(paddedPassword),
      Buffer.from(paddedStaffPassword)
    ) && password.length === staff.password.length
    
    if (isValidPassword) {
      recordAttempt(ip, true)
      
      // Get current project assignment from Supabase database
      const { data: assignment } = await supabase
        .from('assignments')
        .select('project_name')
        .eq('staff_id', staff.fileId)
        .single()
      
      const assignedProject = assignment?.project_name || null
      
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex')
      const now = Date.now()
      const expiresAt = now + 8 * 60 * 60 * 1000 // 8 hours (work shift)
      
      // Store session server-side
      staffSessionStore.set(sessionToken, {
        staffId: staff.fileId,
        name: staff.name,
        assignedProject: assignedProject,
        createdAt: now,
        expiresAt: expiresAt
      })
      
      const response = NextResponse.json({ 
        success: true, 
        staff: {
          fileId: staff.fileId,
          name: staff.name,
          assignedProject: assignedProject
        }
      })
      
      // Set secure HTTP-only cookie
      response.cookies.set('staff-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(expiresAt),
        path: '/'
      })
      
      return response
    } else {
      recordAttempt(ip, false)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Invalid File ID or Password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Staff auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}