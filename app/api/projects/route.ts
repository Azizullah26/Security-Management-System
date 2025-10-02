import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const isValidSession = verifyAdminSession(request)
    
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 403 }
      )
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects from database' },
        { status: 500 }
      )
    }

    const formattedProjects = (projects || []).map(project => ({
      id: project.id.toString(),
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.start_date,
      assignedTo: project.assigned_to
    }))

    return NextResponse.json(formattedProjects)
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isValidSession = verifyAdminSession(request)
    
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, projectId, securityPersonId } = body

    if (action === "assign") {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          assigned_to: securityPersonId,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        console.error('Assignment error:', error)
        return NextResponse.json(
          { error: 'Failed to assign project' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, project: data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error('Project assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to assign project' },
      { status: 500 }
    )
  }
}
