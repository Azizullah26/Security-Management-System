import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/server"

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

    const { data: projects, error } = await supabase.from("projects").select("*").order("name")

    if (error) {
      console.error("[v0] Supabase error fetching projects:", error)
      return NextResponse.json({ error: "Failed to fetch projects", details: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", projects?.length || 0, "projects from Supabase")
    return NextResponse.json(projects || [])
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
