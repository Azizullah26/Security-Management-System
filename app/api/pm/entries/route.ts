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

    // Get PM's assigned projects (comma-separated string from project_managers table)
    const assignedProjectsStr = pm.assigned_projects || ''
    const assignedProjects = assignedProjectsStr
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean)

    console.log('[v0] PM assigned projects:', assignedProjects)

    if (assignedProjects.length === 0) {
      return NextResponse.json({ entries: [] })
    }

    // Fetch entries where project_name matches any of PM's assigned projects
    const { data: entries, error } = await supabase
      .from('entries')
      .select(
        'id, duration, project_name, created_at, email, number_of_persons, contact_number, status, category, name, company, phone'
      )
      .in('project_name', assignedProjects)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Entries fetch error:', error)
      throw error
    }

    console.log('[v0] Fetched entries count:', entries?.length)

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('[v0] PM entries error:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}
