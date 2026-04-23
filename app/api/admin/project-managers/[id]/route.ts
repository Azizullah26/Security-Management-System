import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'PM ID is required' }, { status: 400 })
    }

    // Delete in order: sessions, assignments, then account
    await supabase.from('pm_sessions').delete().eq('pm_id', id)
    await supabase.from('pm_project_assignments').delete().eq('pm_id', id)

    const { error } = await supabase.from('project_managers').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PM delete error:', error)
    return NextResponse.json({ error: 'Failed to delete Project Manager' }, { status: 500 })
  }
}
