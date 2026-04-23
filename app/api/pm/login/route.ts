import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    // Find PM account by email
    const { data: pmAccount, error: fetchError } = await supabase
      .from('project_managers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (fetchError || !pmAccount) {
      console.log('[v0] PM account not found:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    // Check if account is active
    if (!pmAccount.is_active) {
      console.log('[v0] PM account is inactive:', email)
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 },
      )
    }

    // Verify password
    const hashedPassword = hashPassword(password)
    if (pmAccount.password_hash !== hashedPassword) {
      console.log('[v0] PM password mismatch for:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Create PM session
    const { error: sessionError } = await supabase
      .from('pm_sessions')
      .insert({
        pm_id: pmAccount.id,
        token,
        expires_at: expiresAt,
        user_agent: request.headers.get('user-agent') || '',
        ip_address: request.headers.get('x-forwarded-for') || '',
      })

    if (sessionError) {
      console.error('[v0] Failed to create PM session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 },
      )
    }

    // Log audit event
    await supabase
      .from('pm_audit_logs')
      .insert({
        pm_id: pmAccount.id,
        action: 'login',
        details: { email, timestamp: new Date().toISOString() },
      })

    console.log('[v0] PM login successful:', email)

    return NextResponse.json({
      success: true,
      token,
      pm: {
        id: pmAccount.id,
        email: pmAccount.email,
        name: pmAccount.name,
        role: pmAccount.role,
      },
    })
  } catch (error) {
    console.error('[v0] PM login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 },
    )
  }
}
