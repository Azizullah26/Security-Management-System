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
