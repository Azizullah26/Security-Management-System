import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

// GET - List all available projects from assignments table
export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Available projects endpoint called')
    
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    console.log('[v0] Admin verified:', isAdmin)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all project_name values from assignments table
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('project_name')

    console.log('[v0] Assignments query result - rows:', assignments?.length, 'error:', error)

    if (error) {
      console.error('[v0] Error fetching projects from assignments:', error)
      throw error
    }

    // Get unique project names, filter out nulls/empty, and sort them
    const uniqueProjectNames = Array.from(
      new Set(
        (assignments || [])
          .map(a => a.project_name)
          .filter(name => name && name.trim().length > 0)
      )
    ).sort() as string[]
    
    console.log('[v0] Found available projects:', uniqueProjectNames.length)
    console.log('[v0] Unique projects list:', uniqueProjectNames.slice(0, 3))

    // Return as array of strings (project names only)
    return NextResponse.json({ 
      projects: uniqueProjectNames,
      total: uniqueProjectNames.length
    })
  } catch (error) {
    console.error('[v0] Available projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch available projects', details: String(error) }, { status: 500 })
  }
}
