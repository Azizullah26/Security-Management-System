import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

// GET - List all available projects (those assigned to security staff)
export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Available projects endpoint called')
    
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    console.log('[v0] Admin verified:', isAdmin)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all unique projects from staff assignments
    const { data: staffProjects, error: staffError } = await supabase
      .from('staff_project_assignment')
      .select('project_name')
      .distinct()

    if (staffError) {
      console.error('[v0] Error fetching staff projects:', staffError)
      throw staffError
    }

    const projectNames = staffProjects?.map(p => p.project_name).filter(Boolean) || []
    
    console.log('[v0] Found available projects:', projectNames.length)

    return NextResponse.json({ 
      projects: projectNames,
      total: projectNames.length
    })
  } catch (error) {
    console.error('[v0] Available projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch available projects' }, { status: 500 })
  }
}
