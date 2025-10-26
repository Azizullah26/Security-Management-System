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
  woNumber?: string
  client?: string
  agreement?: string
}

function extractWONumber(projectName: string): string | undefined {
  const patterns = [/W\.O\.\s*(\d+)/i, /WO\.\s*(\d+)/i, /WOCM\s*(\d+:\d+)/i, /DWO:\s*(\d+)/i, /WOC\s*(\d+:\d+)/i]

  for (const pattern of patterns) {
    const match = projectName.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return undefined
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

    const activeDbProjects = (dbProjects || [])
      .filter((p) => p.status === "active")
      .map((p) => ({
        ...p,
        woNumber: extractWONumber(p.name),
      }))

    const additionalProjects: Project[] = ALL_PROJECTS.filter(
      (projectName) => !existingProjectNames.has(projectName),
    ).map((projectName, index) => ({
      id: `static-${index + 1}`,
      name: projectName,
      description: "Project from master list",
      status: "active",
      assignedTo: null,
      priority: "medium",
      startDate: new Date().toISOString(),
      woNumber: extractWONumber(projectName),
    }))

    let odooProjects: Project[] = []
    try {
      console.log("[v0] Fetching projects from Odoo...")
      const odooResponse = await fetch(`${request.nextUrl.origin}/api/odoo/projects`)

      if (odooResponse.ok) {
        const odooData = await odooResponse.json()
        if (odooData.success && odooData.projects && Array.isArray(odooData.projects)) {
          odooProjects = odooData.projects
            .filter((p: any) => p.name && !existingProjectNames.has(p.name))
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              description: "Project from Odoo",
              status: p.status || "active",
              assignedTo: null,
              priority: "medium",
              startDate: new Date().toISOString(),
              woNumber: p.woNumber || extractWONumber(p.name),
              client: p.client,
              agreement: p.agreement,
            }))
          console.log("[v0] Successfully fetched", odooProjects.length, "active projects from Odoo")
        }
      } else {
        console.warn("[v0] Failed to fetch Odoo projects:", odooResponse.status)
      }
    } catch (odooError) {
      console.warn("[v0] Error fetching Odoo projects (continuing without them):", odooError)
    }

    const allProjects = [...activeDbProjects, ...additionalProjects, ...odooProjects]

    console.log(
      "[v0] Successfully fetched",
      allProjects.length,
      "active projects (",
      activeDbProjects.length,
      "from DB,",
      additionalProjects.length,
      "from master list,",
      odooProjects.length,
      "from Odoo)",
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
