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

    // Fetch projects assigned to this PM
    const { data: assignments, error } = await supabase
      .from('pm_project_assignments')
      .select('*, entries(count)')
      .eq('pm_id', pmId)

    if (error) {
      throw error
    }

    // Get project details and staff count
    const projects = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: staffData } = await supabase
          .from('entries')
          .select('created_by', { count: 'exact' })
          .eq('project_name', assignment.project_name)
          .distinct()

        return {
          id: assignment.id,
          name: assignment.project_name,
          staff_count: staffData?.length || 0,
          entry_count: assignment.entries?.[0]?.count || 0,
          assigned_at: assignment.assigned_at,
        }
      }),
    )

    console.log('[v0] PM projects fetched:', pmId, projects.length)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[v0] PM projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
