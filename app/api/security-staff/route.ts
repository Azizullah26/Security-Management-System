import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import type { SecurityPerson } from "@/lib/types"

export const dynamic = "force-dynamic"

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

export async function GET() {
  try {
    console.log("[v0] GET /api/security-staff - Fetching from Supabase")

    const supabase = await createServiceRoleClient()

    const { data: staffData, error } = await supabase.from("security_staff").select("*").order("full_name")

    if (error) {
      console.error("[v0] Supabase error fetching security staff:", error)
      return NextResponse.json({ error: "Failed to fetch security staff", details: error.message }, { status: 500 })
    }

    const securityStaff: SecurityPerson[] = (staffData || []).map((staff) => ({
      id: staff.id,
      name: staff.full_name,
      email: "",
      phone: "",
      employeeId: staff.file_id,
      position: staff.position || "Security Guard",
      department: staff.department_staff || "Security",
      status: "Active",
      hireDate: staff.created_at ? new Date(staff.created_at).toISOString().split("T")[0] : "",
      assignedProjects: [],
      password: staff.current_password || staff.file_id, // Return actual password for admin viewing
    }))

    console.log("[v0] Successfully fetched", securityStaff.length, "security staff members")
    return NextResponse.json(securityStaff)
  } catch (error) {
    console.error("[v0] Error fetching security staff:", error)
    return NextResponse.json(
      { error: "Failed to fetch security staff", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("[v0] POST /api/security-staff - Adding new staff member")

    const body = await request.json()

    if (!body.name || !body.employeeId) {
      console.error("[v0] Missing required fields:", {
        name: !!body.name,
        employeeId: !!body.employeeId,
      })
      return NextResponse.json({ error: "Missing required fields: name and employeeId are required" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const { data: existingStaff, error: checkError } = await supabase
      .from("security_staff")
      .select("file_id")
      .eq("file_id", body.employeeId)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing staff:", checkError.message)
      return NextResponse.json({ error: "Database error", details: checkError.message }, { status: 500 })
    }

    if (existingStaff) {
      console.error("[v0] Employee ID already exists:", body.employeeId)
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 })
    }

    const defaultPassword = body.employeeId
    const passwordHash = await hashPassword(defaultPassword)

    console.log("[v0] Creating staff member with password:", defaultPassword)

    const { data: newStaff, error: insertError } = await supabase
      .from("security_staff")
      .insert({
        file_id: body.employeeId,
        full_name: body.name,
        position: body.position || "Security Guard",
        department_staff: body.department || "Security",
        password_hash: passwordHash,
        current_password: defaultPassword,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting staff member:", insertError.message)
      return NextResponse.json({ error: "Failed to add staff member", details: insertError.message }, { status: 500 })
    }

    const staffResponse: SecurityPerson = {
      id: newStaff.id,
      name: newStaff.full_name,
      email: "",
      phone: "",
      employeeId: newStaff.file_id,
      position: newStaff.position,
      department: newStaff.department_staff,
      status: "Active",
      hireDate: newStaff.created_at ? new Date(newStaff.created_at).toISOString().split("T")[0] : "",
      assignedProjects: [],
    }

    console.log(
      "[v0] ✅ Successfully added staff member:",
      staffResponse.name,
      "with default password:",
      defaultPassword,
    )
    return NextResponse.json(staffResponse, { status: 201 })
  } catch (error) {
    console.error("[v0] Error adding staff member:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[v0] PUT /api/security-staff - Updating staff member")

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const updateData: any = {}
    if (body.name) updateData.full_name = body.name
    if (body.employeeId) updateData.file_id = body.employeeId
    if (body.position) updateData.position = body.position
    if (body.department) updateData.department_staff = body.department

    const { data: updatedStaff, error } = await supabase
      .from("security_staff")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating staff:", error.message)
      return NextResponse.json({ error: "Failed to update staff", details: error.message }, { status: 500 })
    }

    console.log("[v0] ✅ Successfully updated staff member:", updatedStaff.full_name)
    return NextResponse.json({
      id: updatedStaff.id,
      name: updatedStaff.full_name,
      employeeId: updatedStaff.file_id,
      position: updatedStaff.position,
      department: updatedStaff.department_staff,
    })
  } catch (error) {
    console.error("[v0] Error updating staff:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    console.log("[v0] PATCH /api/security-staff - Changing password")

    const body = await request.json()

    if (!body.id || !body.newPassword) {
      return NextResponse.json({ error: "Missing staff ID or new password" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const passwordHash = await hashPassword(body.newPassword)

    const { error } = await supabase
      .from("security_staff")
      .update({
        password_hash: passwordHash,
        current_password: body.newPassword,
      })
      .eq("id", body.id)

    if (error) {
      console.error("[v0] Error changing password:", error.message)
      return NextResponse.json({ error: "Failed to change password", details: error.message }, { status: 500 })
    }

    console.log("[v0] ✅ Successfully changed password for staff ID:", body.id, "to:", body.newPassword)
    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Error changing password:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
