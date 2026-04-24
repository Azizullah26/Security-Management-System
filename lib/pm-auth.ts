import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

export async function verifyPMSession(authHeader: string | null): Promise<any | null> {
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
