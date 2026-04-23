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
    const project = searchParams.get('project')

    if (pmId !== pm.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get PM's assigned projects
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', pmId)

    const assignedProjects = assignments?.map((a) => a.project_name) || []

    // Fetch staff records from PM's projects
    let query = supabase
      .from('entries')
      .select('id, name, category, company, project_name, entry_time, exit_time, created_by', { count: 'exact' })
      .in('project_name', assignedProjects)

    if (project && project !== 'all') {
      query = query.eq('project_name', project)
    }

    const { data: staffEntries, error } = await query

    if (error) {
      throw error
    }

    // Group by staff member
    const staffMap = new Map<string, any>()
    staffEntries?.forEach((entry: any) => {
      const key = `${entry.name}-${entry.project_name}`
      if (!staffMap.has(key)) {
        staffMap.set(key, {
          id: entry.id,
          name: entry.name,
          category: entry.category,
          company: entry.company,
          project_name: entry.project_name,
          entry_count: 0,
          last_entry: entry.entry_time,
        })
      }
      const staff = staffMap.get(key)
      staff.entry_count += 1
      if (entry.entry_time > staff.last_entry) {
        staff.last_entry = entry.entry_time
      }
    })

    const staff = Array.from(staffMap.values())

    console.log('[v0] PM staff fetched:', pmId, staff.length)

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('[v0] PM staff error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff records' }, { status: 500 })
  }
}
