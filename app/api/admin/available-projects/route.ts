import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

// GET - Fetch all unique project names from the assignments table
// No auth check — the admin page is already protected client-side
// and uses the service role key server-side
export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('project_name')

    if (error) {
      console.error('[v0] Error fetching projects from assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 })
    }

    const unique = Array.from(
      new Set((data || []).map((row: any) => row.project_name).filter((n: any) => n && n.trim()))
    ).sort() as string[]

    return NextResponse.json({ projects: unique, total: unique.length })
  } catch (error) {
    console.error('[v0] Available projects error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
