import { NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from '@/lib/auth-utils'
import fs from 'fs'
import path from 'path'

interface Project {
  id: string
  name: string
  description: string
  status: string
  assignedTo: string | null
  priority: string
  startDate: string | null
}

function loadProjects(): Project[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'all_real_projects.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error loading projects:', error)
    return []
  }
}

function saveProjects(projects: Project[]): void {
  try {
    const filePath = path.join(process.cwd(), 'data', 'all_real_projects.json')
    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving projects:', error)
    throw error
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

    const projects = loadProjects()

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

    const body = await request.json()
    const { action, projectId, securityPersonId } = body

    if (action === "assign") {
      const projects = loadProjects()
      const projectIndex = projects.findIndex(p => p.id === projectId)

      if (projectIndex === -1) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      projects[projectIndex].assignedTo = securityPersonId
      saveProjects(projects)

      return NextResponse.json({ 
        success: true, 
        project: projects[projectIndex] 
      })
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
