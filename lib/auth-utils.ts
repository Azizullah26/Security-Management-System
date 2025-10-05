import { NextRequest } from 'next/server'
import { supabase } from './supabase'

// Shared admin session store (deprecated - using Supabase now)
export const adminSessionStore = new Map<string, { 
  createdAt: number
  expiresAt: number 
}>()

// Direct admin verification using Supabase
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const adminSession = request.cookies.get('admin-session')?.value
  
  if (!adminSession) {
    return false
  }
  
  try {
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', adminSession)
      .single()
    
    if (error || !session) {
      return false
    }
    
    const now = Date.now()
    if (now > session.expires_at) {
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', adminSession)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Session verification error:', error)
    return false
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  const providedToken = request.headers.get('x-csrf-token')
  if (!providedToken || !expectedToken) {
    return false
  }
  
  // Use constant-time comparison
  const crypto = require('crypto')
  const maxLength = Math.max(providedToken.length, expectedToken.length)
  const paddedProvided = providedToken.padEnd(maxLength, '\0')
  const paddedExpected = expectedToken.padEnd(maxLength, '\0')
  
  return crypto.timingSafeEqual(
    Buffer.from(paddedProvided),
    Buffer.from(paddedExpected)
  ) && providedToken.length === expectedToken.length
}

// Input validation helpers
export function validateEntryRecord(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.name || typeof data.name !== 'string' || data.name.length > 100) {
    errors.push('Name is required and must be less than 100 characters')
  }
  
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required')
  }
  
  if (!data.contactNumber || typeof data.contactNumber !== 'string' || data.contactNumber.length > 20) {
    errors.push('Contact number is required and must be less than 20 characters')
  }
  
  if (data.company && typeof data.company !== 'string') {
    errors.push('Company must be a string')
  }
  
  if (data.purpose && typeof data.purpose !== 'string') {
    errors.push('Purpose must be a string')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Ensure staff has a valid project assignment
export function validateStaffProjectAssignment(staffSession: any): boolean {
  return staffSession && staffSession.assignedProject && staffSession.assignedProject.trim() !== ''
}

// Request size validation
export function validateRequestSize(data: any): boolean {
  const jsonString = JSON.stringify(data)
  return jsonString.length <= 1024 * 500 // 500KB limit for large staff photos
}