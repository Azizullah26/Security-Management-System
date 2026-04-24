import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

async function verifyPMSession(authHeader: string | null): Promise<any | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const now = Date.now()

  // Query using correct column name: session_token, and compare bigint expires_at
  const { data: session, error } = await supabase
    .from('pm_sessions')
    .select('pm_id, expires_at')
    .eq('session_token', token)
    .single()

  if (error || !session) return null
  if (session.expires_at < now) return null

  // Fetch the PM account
  const { data: pm, error: pmError } = await supabase
    .from('project_managers')
    .select('id, full_name, email, username, is_active')
    .eq('id', session.pm_id)
    .eq('is_active', true)
    .single()

  if (pmError || !pm) return null
  return pm
}

export async function GET(request: NextRequest) {
  try {
    const pm = await verifyPMSession(request.headers.get('authorization'))

    if (!pm) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    // Get PM's assigned projects from pm_project_assignments
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', pm.id)

    const assignedProjects = assignments?.map((a: any) => a.project_name).filter(Boolean) || []

    return NextResponse.json({
      pm: {
        id: pm.id,
        email: pm.email,
        username: pm.username,
        name: pm.full_name,
        role: 'project_manager',
        assignedProjects,
      },
    })
  } catch (error) {
    console.error('[v0] PM verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
