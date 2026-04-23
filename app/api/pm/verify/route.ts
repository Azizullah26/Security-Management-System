import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 },
      )
    }

    const token = authHeader.substring(7)

    // Find valid session by token
    const { data: session, error: sessionError } = await supabase
      .from('pm_sessions')
      .select('*, project_managers(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      console.log('[v0] Invalid or expired PM session token')
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 },
      )
    }

    console.log('[v0] PM session verified:', session.project_managers.email)

    // Get PM's assigned projects
    const { data: assignments } = await supabase
      .from('pm_project_assignments')
      .select('project_name')
      .eq('pm_id', session.project_managers.id)

    const assignedProjects = assignments?.map(a => a.project_name) || []

    return NextResponse.json({
      pm: {
        id: session.project_managers.id,
        email: session.project_managers.email,
        name: session.project_managers.name,
        role: session.project_managers.role,
        assignedProjects,
      },
    })
  } catch (error) {
    console.error('[v0] PM verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 },
    )
  }
}
