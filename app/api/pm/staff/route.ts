import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPMSession } from '@/lib/pm-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

export async function GET(request: NextRequest) {
  try {
    const pm = await verifyPMSession(request.headers.get('authorization'))
    if (!pm) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const project = searchParams.get('project') || 'all'

    // Get PM's assigned project names
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', pm.id)

    const assignedProjects = assignments?.map((a: any) => a.project_name).filter(Boolean) || []

    if (assignedProjects.length === 0) {
      return NextResponse.json({ staff: [] })
    }

    // Fetch staff assignments filtered strictly to PM's assigned projects
    let query = supabase
      .from('assignments')
      .select('id, staff_id, staff_name, project_name, created_at')
      .in('project_name', assignedProjects)
      .order('created_at', { ascending: false })

    if (project !== 'all' && assignedProjects.includes(project)) {
      query = query.eq('project_name', project)
    }

    const { data: staffData, error } = await query

    if (error) throw error

    return NextResponse.json({ staff: staffData || [] })
  } catch (error) {
    console.error('[v0] PM staff error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff records' }, { status: 500 })
  }
}
