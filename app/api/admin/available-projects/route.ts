import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

// GET - List all available projects (from projects table)
export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Available projects endpoint called')
    
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    console.log('[v0] Admin verified:', isAdmin)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all projects from projects table
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching projects:', error)
      throw error
    }

    console.log('[v0] Found available projects:', projects?.length)
    
    // Return projects in the format needed by the component
    const projectList = projects?.map(p => ({
      id: p.id,
      name: p.name
    })) || []

    return NextResponse.json({ 
      projects: projectList,
      total: projectList.length
    })
  } catch (error) {
    console.error('[v0] Available projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch available projects', details: String(error) }, { status: 500 })
  }
}
