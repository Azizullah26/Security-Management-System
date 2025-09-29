import { NextRequest, NextResponse } from 'next/server'
import { staffSessionStore } from '../staff/auth/route'
import { projectAssignments, getAllAssignments, setAssignment, removeAssignment } from '@/lib/assignments-store'

// Staff data to sync with assignments
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
    // Convert assignments map to array format for easier handling
    const allAssignments = getAllAssignments()
    const assignments = allAssignments.map(({ staffId, projectName }) => {
      const staff = staffData.find(s => s.fileId === staffId)
      return {
        staffId,
        staffName: staff?.name || 'Unknown',
        projectName
      }
    })

    return NextResponse.json({ assignments })
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
    const { staffId, projectName } = await request.json()
    
    if (!staffId || !projectName) {
      return NextResponse.json(
        { error: 'Staff ID and Project Name are required' },
        { status: 400 }
      )
    }

    // Verify staff exists
    const staff = staffData.find(s => s.fileId === staffId)
    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Assign project to staff
    setAssignment(staffId, projectName)

    // Update all active sessions for this staff member
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
    const { staffId } = await request.json()
    
    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Remove assignment
    removeAssignment(staffId)

    // Update all active sessions for this staff member
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