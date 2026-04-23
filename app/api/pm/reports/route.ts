import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

async function verifyPMToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: session } = await supabase
    .from('pm_sessions')
    .select('*, project_managers(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session?.project_managers || null
}

export async function GET(request: NextRequest) {
  try {
    const pm = await verifyPMToken(request.headers.get('authorization'))
    if (!pm) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pmId = searchParams.get('pm_id')

    if (pmId !== pm.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get PM's assigned projects
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', pmId)

    const assignedProjects = assignments?.map((a) => a.project_name) || []

    // Calculate stats for each project
    const stats = await Promise.all(
      assignedProjects.map(async (projectName) => {
        // Total entries
        const { count: totalEntries } = await supabase
          .from('entries')
          .select('*', { count: 'exact' })
          .eq('project_name', projectName)

        // Unique staff
        const { data: staffData } = await supabase
          .from('entries')
          .select('created_by')
          .eq('project_name', projectName)
          .distinct()

        // Average duration
        const { data: durations } = await supabase
          .from('entries')
          .select('entry_time, exit_time')
          .eq('project_name', projectName)
          .not('exit_time', 'is', null)

        let avgDuration = 'N/A'
        if (durations && durations.length > 0) {
          const totalMinutes = durations.reduce((sum, entry) => {
            const start = new Date(entry.entry_time).getTime()
            const end = new Date(entry.exit_time).getTime()
            return sum + (end - start) / (1000 * 60)
          }, 0)
          const avgMinutes = Math.round(totalMinutes / durations.length)
          const hours = Math.floor(avgMinutes / 60)
          const minutes = avgMinutes % 60
          avgDuration = `${hours}h ${minutes}m`
        }

        return {
          project_name: projectName,
          total_entries: totalEntries || 0,
          total_staff: staffData?.length || 0,
          average_duration: avgDuration,
          last_updated: new Date().toISOString(),
        }
      }),
    )

    console.log('[v0] PM reports fetched:', pmId, stats.length)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[v0] PM reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
