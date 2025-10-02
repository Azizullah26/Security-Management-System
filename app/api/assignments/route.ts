import { NextRequest, NextResponse } from 'next/server'
import { staffSessionStore } from '../staff/auth/route'
import { verifyAdminSession } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

const staffData = [
  { fileId: '3252', name: 'Mohus' },
  { fileId: '3242', name: 'Umair' },
  { fileId: '3253', name: 'Salman' },
  { fileId: '2234', name: 'Tanweer' },
  { fileId: '3245', name: 'Tilak' },
  { fileId: '3248', name: 'Ramesh' },
]

export async function GET(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    const formattedAssignments = (assignments || []).map((assignment) => {
      const staff = staffData.find(s => s.fileId === assignment.staff_id)
      return {
        staffId: assignment.staff_id,
        staffName: staff?.name || 'Unknown',
        projectName: assignment.project_name
      }
    })

    return NextResponse.json({ assignments: formattedAssignments })
  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { staffId, projectName } = await request.json()
    
    if (!staffId || !projectName) {
      return NextResponse.json(
        { error: 'Staff ID and Project Name are required' },
        { status: 400 }
      )
    }

    const staff = staffData.find(s => s.fileId === staffId)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('assignments')
      .upsert({
        staff_id: staffId,
        project_name: projectName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'staff_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    for (const [sessionToken, session] of staffSessionStore.entries()) {
      if (session.staffId === staffId) {
        session.assignedProject = projectName
      }
    }

    return NextResponse.json({ 
      success: true, 
      assignment: {
        staffId,
        staffName: staff.name,
        projectName
      }
    })
  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { staffId } = await request.json()
    
    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('staff_id', staffId)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
      )
    }

    for (const [sessionToken, session] of staffSessionStore.entries()) {
      if (session.staffId === staffId) {
        session.assignedProject = null
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assignment deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
