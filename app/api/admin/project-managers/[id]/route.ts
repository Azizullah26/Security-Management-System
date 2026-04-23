import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pmId = params.id

    if (!pmId) {
      return NextResponse.json({ error: 'PM ID is required' }, { status: 400 })
    }

    // Delete PM sessions
    await supabase.from('pm_sessions').delete().eq('pm_id', pmId)

    // Delete PM project assignments
    await supabase.from('pm_project_assignments').delete().eq('pm_id', pmId)

    // Delete PM account
    const { error } = await supabase
      .from('project_managers')
      .delete()
      .eq('id', pmId)

    if (error) {
      throw error
    }

    console.log('[v0] Admin deleted Project Manager:', pmId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Admin delete PM error:', error)
    return NextResponse.json({ error: 'Failed to delete Project Manager' }, { status: 500 })
  }
}
