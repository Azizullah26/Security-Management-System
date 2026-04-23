import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth-utils'
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
    console.log('[v0] PM GET endpoint called')
    
    // Verify admin session using proper auth-utils function
    const isAdmin = await verifyAdminSession(request)
    console.log('[v0] Admin verified:', isAdmin)
    
    if (!isAdmin) {
      console.log('[v0] Admin authentication failed')
      return NextResponse.json({ error: 'Unauthorized - Admin authentication required' }, { status: 401 })
    }

    const { data: projectManagers, error } = await supabase
      .from('project_managers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching PMs:', error)
      throw error
    }

    console.log('[v0] Admin retrieved Project Managers:', projectManagers?.length)

    return NextResponse.json({ projectManagers: projectManagers || [] })
  } catch (error) {
    console.error('[v0] Admin get PMs error:', error)
    return NextResponse.json({ error: 'Failed to fetch Project Managers', details: String(error) }, { status: 500 })
  }
}

// POST - Create new Project Manager
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] PM POST endpoint called')
    
    // Verify admin session
    const isAdmin = await verifyAdminSession(request)
    console.log('[v0] Admin verified:', isAdmin)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin authentication required' }, { status: 401 })
    }

    const { email, name, password, projects } = await request.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields: email, name, password' }, { status: 400 })
    }

    console.log('[v0] Creating PM:', { email, name, projectCount: projects?.length })

    // Check if email already exists
    const { data: existingPM } = await supabase
      .from('project_managers')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

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
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] Error creating PM:', createError)
      throw createError
    }

    console.log('[v0] PM created:', newPM?.id)

    // Assign projects if provided
    if (projects && projects.length > 0) {
      const assignments = projects.map((project: string) => ({
        pm_id: newPM.id,
        project_name: project,
        assigned_at: new Date().toISOString(),
      }))

      const { error: assignError } = await supabase
        .from('pm_project_assignments')
        .insert(assignments)

      if (assignError) {
        console.error('[v0] Error assigning projects:', assignError)
      } else {
        console.log('[v0] Projects assigned to PM:', projects.length)
      }
    }

    // Log audit event
    await supabase.from('pm_audit_logs').insert({
      pm_id: newPM.id,
      action: 'created_by_admin',
      details: { email, name, projects },
      created_at: new Date().toISOString(),
    }).catch(e => console.error('[v0] Audit log error:', e))

    console.log('[v0] Admin created Project Manager:', email)

    return NextResponse.json({ projectManager: newPM, success: true })
  } catch (error) {
    console.error('[v0] Admin create PM error:', error)
    return NextResponse.json({ error: 'Failed to create Project Manager', details: String(error) }, { status: 500 })
  }
}
