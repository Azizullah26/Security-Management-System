import { NextRequest, NextResponse } from "next/server"
import type { Project } from "@/lib/types"
import { verifyAdminSession } from '@/lib/auth-utils'
import path from 'path'
import fs from 'fs'

// Load projects data safely
function loadProjectsData(): { projects: Project[], error?: string } {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'all_real_projects.json')
    const projectsData = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as Project[]
    
    if (!Array.isArray(projectsData)) {
      return { projects: [], error: 'Projects data is not an array' }
    }
    
    if (projectsData.length !== 245) {
      console.warn(`Expected 245 projects, got ${projectsData.length}`)
      return { projects: projectsData, error: `Expected 245 projects, got ${projectsData.length}` }
    }
    
    return { projects: projectsData }
  } catch (error) {
    console.error('Failed to load projects data:', error)
    return { projects: [], error: 'Failed to load projects data' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const isValidSession = verifyAdminSession(request)
    
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 403 }
      )
    }

    const { projects, error } = loadProjectsData()
    
    if (error) {
      console.error('Projects data error:', error)
      return NextResponse.json(
        { error: 'Failed to load projects data' },
        { status: 500 }
      )
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isValidSession = verifyAdminSession(request)
    
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 403 }
      )
    }

    const { projects, error } = loadProjectsData()
    
    if (error) {
      console.error('Projects data error:', error)
      return NextResponse.json(
        { error: 'Failed to load projects data' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { action, projectId, securityPersonId } = body

    if (action === "assign") {
      // In real app, update database
      const projectIndex = projects.findIndex((p: Project) => p.id === projectId)
      if (projectIndex !== -1) {
        projects[projectIndex].assignedTo = securityPersonId
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error('Project assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to assign project' },
      { status: 500 }
    )
  }
}