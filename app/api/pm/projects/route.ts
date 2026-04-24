import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPMSession } from '@/lib/pm-auth'

// Mark this route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic'

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

    // Get PM's assigned project names from pm_project_assignments
    const { data: assignments, error: assignError } = await supabase
      .from('pm_project_assignments')
      .select('id, project_name, assigned_date')
      .eq('pm_id', pm.id)

    if (assignError) throw assignError

    const assignedProjectNames = assignments?.map((a: any) => a.project_name).filter(Boolean) || []

    if (assignedProjectNames.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    // For each assigned project, get counts from assignments and entries tables
    const projects = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        const projectName = assignment.project_name

        // Count staff assigned to this project (from assignments table)
        const { count: staffCount } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', projectName)

        // Count entry records for this project
        const { count: entryCount } = await supabase
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', projectName)

        return {
          id: assignment.id,
          name: projectName,
          staff_count: staffCount || 0,
          entry_count: entryCount || 0,
          assigned_at: assignment.assigned_date,
        }
      }),
    )

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[v0] PM projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
