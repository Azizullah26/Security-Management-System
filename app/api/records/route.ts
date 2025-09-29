import { NextRequest, NextResponse } from 'next/server'
import { staffSessionStore } from '../staff/auth/route'
import { verifyAdminSession, validateEntryRecord, validateRequestSize } from '@/lib/auth-utils'

// In-memory storage for demonstration (in production, use a database)
const recordsStore = new Map<string, any>()
const MAX_RECORDS = 10000 // Prevent memory DoS
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 100

// Staff verification 
async function verifyStaff(request: NextRequest) {
  const staffSession = request.cookies.get('staff-session')?.value
  
  if (!staffSession) {
    return null
  }
  
  const session = staffSessionStore.get(staffSession)
  if (!session || Date.now() > session.expiresAt) {
    return null
  }
  
  return session
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin or staff
    const isAdmin = verifyAdminSession(request)
    const staffSession = await verifyStaff(request)
    
    if (!isAdmin && !staffSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      )
    }
    
    const allRecords = Array.from(recordsStore.values())
    
    // If admin, return all records
    if (isAdmin) {
      return NextResponse.json({ records: allRecords })
    }
    
    // If staff, return only records for their assigned project
    if (staffSession) {
      const filteredRecords = allRecords.filter(record => 
        record.projectName === staffSession.assignedProject
      )
      return NextResponse.json({ records: filteredRecords })
    }
    
    return NextResponse.json({ records: [] })
  } catch (error) {
    console.error('Records fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

// Basic rate limiting function
function checkRateLimit(userKey: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userKey)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin or staff
    const isAdmin = verifyAdminSession(request)
    const staffSession = await verifyStaff(request)
    
    const userKey = isAdmin ? 'admin' : staffSession?.staffId || 'unknown'
    
    // Basic rate limiting
    if (!checkRateLimit(userKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Check memory limits
    if (recordsStore.size >= MAX_RECORDS) {
      return NextResponse.json(
        { error: 'Storage capacity reached' },
        { status: 507 }
      )
    }
    
    if (!isAdmin && !staffSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      )
    }
    
    const recordData = await request.json()
    
    // Validate request size
    if (!validateRequestSize(recordData)) {
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      )
    }
    
    // Validate record data
    const validation = validateEntryRecord(recordData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Generate unique ID
    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Add server-side metadata
    const record = {
      ...recordData,
      id: recordId,
      createdAt: new Date().toISOString(),
      createdBy: isAdmin ? 'admin' : staffSession?.staffId || 'unknown'
    }
    
    // If staff is creating the record, ensure it's assigned to their project
    if (staffSession && !isAdmin) {
      if (!staffSession.assignedProject) {
        return NextResponse.json(
          { error: 'Staff member has no project assignment' },
          { status: 403 }
        )
      }
      record.projectName = staffSession.assignedProject
    }
    
    recordsStore.set(recordId, record)
    
    return NextResponse.json({ 
      success: true, 
      record: record
    })
  } catch (error) {
    console.error('Record creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin or staff
    const isAdmin = verifyAdminSession(request)
    const staffSession = await verifyStaff(request)
    
    if (!isAdmin && !staffSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      )
    }
    
    const { recordId, ...updateData } = await request.json()
    
    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }
    
    const existingRecord = recordsStore.get(recordId)
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }
    
    // If staff, ensure they can only update records for their project
    if (staffSession && !isAdmin) {
      if (existingRecord.projectName !== staffSession.assignedProject) {
        return NextResponse.json(
          { error: 'Unauthorized - Cannot modify records outside your project' },
          { status: 403 }
        )
      }
    }
    
    const updatedRecord = {
      ...existingRecord,
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: isAdmin ? 'admin' : staffSession?.staffId || 'unknown'
    }
    
    recordsStore.set(recordId, updatedRecord)
    
    return NextResponse.json({ 
      success: true, 
      record: updatedRecord
    })
  } catch (error) {
    console.error('Record update error:', error)
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    )
  }
}