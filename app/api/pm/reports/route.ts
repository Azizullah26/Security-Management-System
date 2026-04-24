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

    // Get PM's assigned project names
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', pm.id)

    const assignedProjects = assignments?.map((a: any) => a.project_name).filter(Boolean) || []

    if (assignedProjects.length === 0) {
      return NextResponse.json({ stats: [] })
    }

    // Build stats for each assigned project
    const stats = await Promise.all(
      assignedProjects.map(async (projectName: string) => {
        // Total staff in assignments table for this project
        const { count: totalStaff } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', projectName)

        // Total entry records
        const { count: totalEntries } = await supabase
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', projectName)

        // Security reports for this project
        const { count: totalReports } = await supabase
          .from('securityreport')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', projectName)

        // Most recent entry
        const { data: latestEntry } = await supabase
          .from('entries')
          .select('created_at')
          .eq('project_name', projectName)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          project_name: projectName,
          total_staff: totalStaff || 0,
          total_entries: totalEntries || 0,
          total_reports: totalReports || 0,
          last_activity: latestEntry?.created_at || null,
        }
      }),
    )

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[v0] PM reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
