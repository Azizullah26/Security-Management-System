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

// GET - List all Project Managers
export async function GET(request: NextRequest) {
  try {
    const { data: projectManagers, error } = await supabase
      .from('project_managers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    console.log('[v0] Admin retrieved Project Managers:', projectManagers?.length)

    return NextResponse.json({ projectManagers })
  } catch (error) {
    console.error('[v0] Admin get PMs error:', error)
    return NextResponse.json({ error: 'Failed to fetch Project Managers' }, { status: 500 })
  }
}

// POST - Create new Project Manager
export async function POST(request: NextRequest) {
  try {
    const { email, name, password, projects } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingPM } = await supabase
      .from('project_managers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingPM) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Create PM account
    const hashedPassword = hashPassword(password)
    const { data: newPM, error: createError } = await supabase
      .from('project_managers')
      .insert({
        email: email.toLowerCase(),
        name,
        password_hash: hashedPassword,
        role: 'project_manager',
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Assign projects if provided
    if (projects && projects.length > 0) {
      const assignments = projects.map((project: string) => ({
        pm_id: newPM.id,
        project_name: project,
      }))

      const { error: assignError } = await supabase
        .from('pm_project_assignments')
        .insert(assignments)

      if (assignError) {
        console.error('[v0] Error assigning projects:', assignError)
      }
    }

    // Log audit event
    await supabase.from('pm_audit_logs').insert({
      pm_id: newPM.id,
      action: 'created_by_admin',
      details: { email, name },
    })

    console.log('[v0] Admin created Project Manager:', email)

    return NextResponse.json({ projectManager: newPM })
  } catch (error) {
    console.error('[v0] Admin create PM error:', error)
    return NextResponse.json({ error: 'Failed to create Project Manager' }, { status: 500 })
  }
}
