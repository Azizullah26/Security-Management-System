import { type NextRequest, NextResponse } from "next/server"
import { staffSessionStore } from "@/lib/session-store"
import { verifyAdminSession } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/assignments - Fetching assignments...")
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Supabase fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    }

    const formattedAssignments = (assignments || []).map((assignment) => {
      return {
        staffId: assignment.staff_id,
        staffName: assignment.staff_name || "Unknown",
        projectName: assignment.project_name,
      }
    })

    console.log("[v0] Successfully fetched", formattedAssignments.length, "assignments")
    return NextResponse.json({ assignments: formattedAssignments })
  } catch (error) {
    console.error("[v0] Assignments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/assignments - Creating assignment...")
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { staffId, staffName, projectName } = await request.json()
    console.log("[v0] Assignment request:", { staffId, staffName, projectName })

    if (!staffId || !projectName) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Staff ID and Project Name are required" }, { status: 400 })
    }

    // This handles cases where staff might be from Odoo or other sources
    const finalStaffName = staffName || "Unknown"
    console.log("[v0] Using staff name:", finalStaffName)

    console.log("[v0] Creating/updating assignment for staff:", staffId)

    const { data, error } = await supabase
      .from("assignments")
      .upsert(
        {
          staff_id: staffId,
          staff_name: finalStaffName,
          project_name: projectName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "staff_id",
        },
      )
      .select()

    if (error) {
      console.error("[v0] Supabase insert error:", error)
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }

    console.log("[v0] Assignment created successfully:", data)

    for (const [sessionToken, session] of staffSessionStore.entries()) {
      if (session.staffId === staffId) {
        session.assignedProject = projectName
        console.log("[v0] Updated session for staff:", staffId)
      }
    }

    return NextResponse.json({
      success: true,
      assignment: {
        staffId,
        staffName: finalStaffName,
        projectName,
      },
    })
  } catch (error) {
    console.error("[v0] Assignment creation error:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("[v0] DELETE /api/assignments - Removing assignment...")
    const isAdmin = await verifyAdminSession(request)
    if (!isAdmin) {
      console.log("[v0] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { staffId } = await request.json()
    console.log("[v0] Delete request for staffId:", staffId)

    if (!staffId) {
      console.log("[v0] Missing staff ID")
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("assignments").delete().eq("staff_id", staffId)

    if (error) {
      console.error("[v0] Supabase delete error:", error)
      return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
    }

    console.log("[v0] Assignment deleted successfully for staff:", staffId)

    // Update staff session to clear assigned project
    for (const [sessionToken, session] of staffSessionStore.entries()) {
      if (session.staffId === staffId) {
        session.assignedProject = null
        console.log("[v0] Cleared session for staff:", staffId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Assignment deletion error:", error)
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
  }
}
