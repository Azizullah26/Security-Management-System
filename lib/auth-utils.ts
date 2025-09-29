import { NextRequest } from 'next/server'

// Shared admin session store (in production, use Redis or database)
export const adminSessionStore = new Map<string, { 
  createdAt: number
  expiresAt: number 
}>()

// Direct admin verification without self-fetch
export function verifyAdminSession(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin-session')?.value
  
  if (!adminSession) {
    return false
  }
  
  const session = adminSessionStore.get(adminSession)
  if (!session) {
    return false
  }
  
  const now = Date.now()
  if (now > session.expiresAt) {
    adminSessionStore.delete(adminSession)
    return false
  }
  
  return true
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
  return jsonString.length <= 1024 * 100 // 100KB limit
}