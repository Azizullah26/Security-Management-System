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

// GET - List all Project Managers with their assigned projects
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pms, error } = await supabase
      .from('project_managers')
      .select('id, full_name, email, username, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch assigned projects for each PM
    const pmsWithProjects = await Promise.all(
      (pms || []).map(async (pm: any) => {
        const { data: assignments } = await supabase
          .from('pm_project_assignments')
          .select('project_name')
          .eq('pm_id', pm.id)

        return {
          ...pm,
          name: pm.full_name,
          assigned_projects: assignments?.map((a: any) => a.project_name).filter(Boolean) || [],
        }
      }),
    )

    return NextResponse.json({ projectManagers: pmsWithProjects })
  } catch (error) {
    console.error('[v0] GET PMs error:', error)
    return NextResponse.json({ error: 'Failed to fetch Project Managers' }, { status: 500 })
  }
}

// POST - Create new Project Manager
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, full_name, password, projects } = await request.json()

    if (!username || !full_name || !password) {
      return NextResponse.json({ error: 'username, full_name, and password are required' }, { status: 400 })
    }

    // Check duplicate username
    const { data: existing } = await supabase
      .from('project_managers')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    // Create PM — using correct schema columns: full_name, username, password_hash, created_by
    // created_by must reference an existing admin_user (foreign key constraint)
    // Fetch the first admin user ID from admin_users table
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
      .single()

    if (!adminUsers) {
      return NextResponse.json(
        { error: 'No admin user found. Cannot create Project Manager without an admin user.' },
        { status: 400 }
      )
    }

    const { data: newPM, error: createError } = await supabase
      .from('project_managers')
      .insert({
        full_name,
        username: username.toLowerCase(),
        email: `${username.toLowerCase()}@pm.local`,
        password_hash: hashPassword(password),
        is_active: true,
        created_by: adminUsers.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] PM create error:', createError)
      throw createError
    }

    // Assign projects if provided — store project_name strings
    if (projects && projects.length > 0) {
      console.log('[v0] Assigning projects to PM:', { pmId: newPM.id, projects })
      const rows = projects.map((projectName: string) => ({
        pm_id: newPM.id,
        project_name: projectName,
        assigned_date: new Date().toISOString(),
      }))

      console.log('[v0] Project assignment rows to insert:', rows)

      const { error: assignError, data: assignData } = await supabase
        .from('pm_project_assignments')
        .insert(rows)
        .select()

      if (assignError) {
        console.error('[v0] Project assignment error:', assignError)
        throw new Error(`Failed to assign projects: ${assignError.message}`)
      }

      console.log('[v0] Projects assigned successfully:', assignData)
    } else {
      console.log('[v0] No projects provided for assignment')
    }

    return NextResponse.json({
      success: true,
      projectManager: {
        id: newPM.id,
        name: newPM.full_name,
        username: newPM.username,
        is_active: newPM.is_active,
        created_at: newPM.created_at,
        assigned_projects: projects || [],
      },
    })
  } catch (error) {
    console.error('[v0] POST PM error:', error)
    return NextResponse.json({ error: 'Failed to create Project Manager' }, { status: 500 })
  }
}
