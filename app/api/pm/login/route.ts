import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

// Mark this route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Find PM account by username or email
    const { data: pmAccount, error: fetchError } = await supabase
      .from('project_managers')
      .select('*')
      .or(`username.eq.${username.toLowerCase()},email.eq.${username.toLowerCase()}`)
      .eq('is_active', true)
      .single()

    if (fetchError || !pmAccount) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const hashedPassword = hashPassword(password)
    if (pmAccount.password_hash !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24h as bigint ms

    // Create PM session - using correct column names from schema
    const { error: sessionError } = await supabase
      .from('pm_sessions')
      .insert({
        pm_id: pmAccount.id,
        session_token: token,
        expires_at: expiresAt,
        username: pmAccount.username || pmAccount.email,
        created_at: Date.now(),
      })

    if (sessionError) {
      console.error('[v0] Failed to create PM session:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token,
      pm: {
        id: pmAccount.id,
        email: pmAccount.email,
        username: pmAccount.username,
        name: pmAccount.full_name,
        role: 'project_manager',
      },
    })
  } catch (error) {
    console.error('[v0] PM login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
