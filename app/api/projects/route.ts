import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { ALL_PROJECTS } from "@/lib/all-projects-data"

export const dynamic = "force-dynamic"

interface Project {
  id: string
  name: string
  description: string
  status: string
  assignedTo: string | null
  priority: string
  startDate: string | null
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/projects - Fetching projects from Supabase")

    const supabase = await createServiceRoleClient()

    const { data: dbProjects, error } = await supabase.from("projects").select("*").order("name")

    if (error) {
      console.error("[v0] Supabase error fetching projects:", error)
      return NextResponse.json({ error: "Failed to fetch projects", details: error.message }, { status: 500 })
    }

    const existingProjectNames = new Set((dbProjects || []).map((p) => p.name))

    // Create project objects for projects not in database
    const additionalProjects: Project[] = ALL_PROJECTS.filter(
      (projectName) => !existingProjectNames.has(projectName),
    ).map((projectName, index) => ({
      id: `static-${index + 1}`,
      name: projectName,
      description: "Project from master list",
      status: "planning",
      assignedTo: null,
      priority: "medium",
      startDate: new Date().toISOString(),
    }))

    // Combine database projects with additional projects
    const allProjects = [...(dbProjects || []), ...additionalProjects]

    console.log(
      "[v0] Successfully fetched",
      allProjects.length,
      "projects (",
      dbProjects?.length || 0,
      "from DB,",
      additionalProjects.length,
      "from master list)",
    )
    return NextResponse.json(allProjects)
  } catch (error) {
    console.error("[v0] Projects fetch error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isValidSession = await verifyAdminSession(request)

    if (!isValidSession) {
      return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 403 })
    }

    const body = await request.json()
    const { action, projectId, securityPersonId } = body

    if (action === "assign") {
      const supabase = await createServiceRoleClient()

      const { data: project, error } = await supabase
        .from("projects")
        .update({ assigned_to: securityPersonId })
        .eq("id", projectId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error assigning project:", error)
        return NextResponse.json({ error: "Failed to assign project", details: error.message }, { status: 500 })
      }

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        project,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Project assignment error:", error)
    return NextResponse.json(
      { error: "Failed to assign project", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
