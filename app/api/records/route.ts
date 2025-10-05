import { NextRequest, NextResponse } from 'next/server'
import { staffSessionStore } from '../staff/auth/route'
import { verifyAdminSession, validateEntryRecord, validateRequestSize } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 100

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

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession(request)
    const staffSession = await verifyStaff(request)
    
    if (!isAdmin && !staffSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      )
    }
    
    // Delete records older than 1 month (automatic cleanup)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    await supabase
      .from('entries')
      .delete()
      .lt('entry_time', oneMonthAgo.toISOString())
    
    let query = supabase.from('entries').select('*').order('entry_time', { ascending: false })
    
    if (staffSession && !isAdmin) {
      query = query.eq('project_name', staffSession.assignedProject)
    }
    
    const { data: records, error } = await query
    
    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch records' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ records: records || [] })
  } catch (error) {
    console.error('Records fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession(request)
    const staffSession = await verifyStaff(request)
    
    const userKey = isAdmin ? 'admin' : staffSession?.staffId || 'unknown'
    
    if (!checkRateLimit(userKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    if (!isAdmin && !staffSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required' },
        { status: 401 }
      )
    }
    
    const recordData = await request.json()
    
    if (!validateRequestSize(recordData)) {
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      )
    }
    
    const validation = validateEntryRecord(recordData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.errors },
        { status: 400 }
      )
    }
    
    const entryData = {
      id: recordData.id,
      category: recordData.category,
      name: recordData.name,
      file_id: recordData.fileId || null,
      company: recordData.company || null,
      contact_number: recordData.contactNumber || null,
      email: recordData.email || null,
      vehicle_number: recordData.vehicleNumber || null,
      number_of_persons: recordData.numberOfPersons || null,
      purpose: recordData.purpose || null,
      entry_time: recordData.entryTime || new Date().toISOString(),
      exit_time: recordData.exitTime || null,
      status: recordData.status || 'inside',
      project_name: recordData.projectName || null
    }
    
    if (staffSession && !isAdmin) {
      if (!staffSession.assignedProject) {
        return NextResponse.json(
          { error: 'Staff member has no project assignment' },
          { status: 403 }
        )
      }
      entryData.project_name = staffSession.assignedProject
    }
    
    const { data, error } = await supabase
      .from('entries')
      .insert(entryData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create record' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      record: data
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
    const isAdmin = await verifyAdminSession(request)
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
    
    const { data: existingRecord, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', recordId)
      .single()
    
    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }
    
    if (staffSession && !isAdmin) {
      if (existingRecord.project_name !== staffSession.assignedProject) {
        return NextResponse.json(
          { error: 'Unauthorized - Cannot modify records outside your project' },
          { status: 403 }
        )
      }
    }
    
    const updateFields: any = {}
    if (updateData.exitTime) updateFields.exit_time = updateData.exitTime
    if (updateData.duration) updateFields.duration = updateData.duration
    if (updateData.name) updateFields.name = updateData.name
    if (updateData.phone) updateFields.phone = updateData.phone
    if (updateData.company) updateFields.company = updateData.company
    if (updateData.vehicleNo) updateFields.vehicle_no = updateData.vehicleNo
    if (updateData.items) updateFields.items = updateData.items
    if (updateData.purpose) updateFields.purpose = updateData.purpose
    if (updateData.host) updateFields.host = updateData.host
    
    const { data: updatedRecord, error: updateError } = await supabase
      .from('entries')
      .update(updateFields)
      .eq('id', recordId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update record' },
        { status: 500 }
      )
    }
    
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
