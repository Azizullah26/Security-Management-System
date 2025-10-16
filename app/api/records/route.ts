import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminSession, validateEntryRecord, validateRequestSize, verifyStaffSession } from "@/lib/auth-utils"
import { createServiceRoleClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 100

function checkRateLimit(userKey: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userKey)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  userLimit.count++
  return true
}

function transformRecordToFrontend(dbRecord: any) {
  return {
    id: dbRecord.id,
    category: dbRecord.category,
    name: dbRecord.name,
    fileId: dbRecord.file_id,
    company: dbRecord.company,
    phone: dbRecord.phone,
    contactNumber: dbRecord.contact_number || dbRecord.phone,
    email: dbRecord.email,
    vehicleNumber: dbRecord.vehicle_number,
    items: dbRecord.items,
    numberOfPersons: dbRecord.number_of_persons,
    purpose: dbRecord.purpose,
    host: dbRecord.host,
    photo: dbRecord.photo,
    entryTime: dbRecord.entry_time,
    exitTime: dbRecord.exit_time,
    duration: dbRecord.duration,
    projectName: dbRecord.project_name,
    status: dbRecord.status,
    createdBy: dbRecord.created_by,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/records - Fetching records")
    console.log(
      "[v0] Request cookies:",
      request.cookies
        .getAll()
        .map((c) => c.name)
        .join(", "),
    )

    const isAdmin = await verifyAdminSession(request)
    console.log("[v0] Admin verification result:", isAdmin)

    const staffSession = await verifyStaffSession(request)
    console.log(
      "[v0] Staff verification result:",
      staffSession ? `authenticated as ${staffSession.name}` : "not authenticated",
    )

    if (!isAdmin && !staffSession) {
      console.log("[v0] Unauthorized access attempt - no valid session")
      return NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get("filter") // 'my-records' or 'all'
    const dateFilter = searchParams.get("date") // 'today' or null

    const supabase = await createServiceRoleClient()

    // Delete records older than 1 month (automatic cleanup)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    console.log("[v0] Cleaning up old records before:", oneMonthAgo.toISOString())
    await supabase.from("entries").delete().lt("entry_time", oneMonthAgo.toISOString())

    let query = supabase.from("entries").select("*").order("entry_time", { ascending: false })

    if (isAdmin) {
      console.log("[v0] Admin access - fetching ALL records from database (no filtering)")
      // No filtering for admin - they see everything
    } else if (staffSession) {
      if (filterType === "my-records") {
        console.log("[v0] Filtering records created by staff:", staffSession.name)
        query = query.eq("created_by", staffSession.name)
      } else {
        console.log("[v0] Filtering records for project:", staffSession.assignedProject)
        query = query.eq("project_name", staffSession.assignedProject)
      }
    }

    if (dateFilter === "today") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      console.log("[v0] Filtering records from today:", todayISO)
      query = query.gte("created_at", todayISO)
    }

    const { data: records, error } = await query

    if (error) {
      console.error("[v0] Supabase fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", records?.length || 0, "records")
    console.log("[v0] Records include entries from all staff members:", isAdmin ? "YES (admin)" : "NO (staff filtered)")

    const transformedRecords = records?.map(transformRecordToFrontend) || []
    console.log(
      "[v0] Sample transformed record:",
      transformedRecords[0] ? JSON.stringify(transformedRecords[0], null, 2) : "No records",
    )

    return NextResponse.json({ records: transformedRecords })
  } catch (error) {
    console.error("[v0] Records fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/records - Creating new entry")

    const isAdmin = await verifyAdminSession(request)
    const staffSession = await verifyStaffSession(request)

    // Rate limiting based on IP for unauthenticated requests
    const userKey = isAdmin ? "admin" : staffSession?.staffId || request.ip || "anonymous"

    if (!checkRateLimit(userKey)) {
      console.log("[v0] Rate limit exceeded for user:", userKey)
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const recordData = await request.json()

    console.log("[v0] Received entry data:", JSON.stringify(recordData, null, 2))

    if (!validateRequestSize(recordData)) {
      console.log("[v0] Request payload too large")
      return NextResponse.json({ error: "Request payload too large" }, { status: 413 })
    }

    const validation = validateEntryRecord(recordData)
    if (!validation.valid) {
      console.log("[v0] Validation failed:", validation.errors)
      return NextResponse.json({ error: "Invalid data", details: validation.errors }, { status: 400 })
    }

    const entryData = {
      id: recordData.id,
      category: recordData.category,
      name: recordData.name,
      file_id: recordData.fileId || null,
      company: recordData.company || null,
      phone: recordData.phone || recordData.contactNumber || null,
      contact_number: recordData.contactNumber || recordData.phone || null,
      email: recordData.email || null,
      vehicle_number: recordData.vehicleNumber || null,
      items: recordData.items || null,
      number_of_persons: recordData.numberOfPersons || null,
      purpose: recordData.purpose || null,
      host: recordData.host || null,
      photo: recordData.photo || null,
      entry_time: recordData.entryTime || new Date().toISOString(),
      exit_time: recordData.exitTime || null,
      duration: recordData.duration || null,
      project_name: recordData.projectName || null,
      status: recordData.status || "active",
      created_by: null as string | null,
    }

    if (staffSession) {
      // If a security guard is logged in, use their name from the session
      // This will be one of: Mohus, Umair, Salman, Tanweer, Tilak, or Ramesh
      entryData.created_by = staffSession.name ?? null
      console.log("[v0] ✅ Setting created_by to logged-in security guard:", staffSession.name)

      if (!staffSession.assignedProject) {
        console.log("[v0] Staff member has no project assignment")
        return NextResponse.json({ error: "Staff member has no project assignment" }, { status: 403 })
      }
      entryData.project_name = staffSession.assignedProject
    } else {
      // No security guard logged in - created_by remains null
      console.log("[v0] ⚠️ No security guard logged in - created_by will be null")
    }

    console.log("[v0] Prepared entry data for insertion:", JSON.stringify(entryData, null, 2))

    const supabase = await createServiceRoleClient()

    console.log("[v0] Attempting to insert into Supabase...")
    const { data, error } = await supabase.from("entries").insert(entryData).select().single()

    if (error) {
      console.error("[v0] Supabase insert error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json(
        {
          error: "Failed to create record",
          details: error.message,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("[v0] ✅ Successfully saved entry to database:", data.id)
    console.log("[v0] ✅ Entry created_by field:", data.created_by || "null")

    return NextResponse.json({
      success: true,
      record: data,
    })
  } catch (error) {
    console.error("[v0] Record creation error:", error)
    return NextResponse.json(
      { error: "Failed to create record", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] PUT /api/records - Updating entry")

    const { recordId, id, exitTime, status, ...updateData } = await request.json()

    const entryId = recordId || id

    if (!entryId) {
      console.log("[v0] Record ID is required")
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }

    const isCheckout = exitTime || status === "exited"
    const hasOtherUpdates = Object.keys(updateData).length > 0

    const isAdmin = await verifyAdminSession(request)
    const staffSession = await verifyStaffSession(request)

    // Require authentication for non-checkout updates
    if (!isCheckout || hasOtherUpdates) {
      if (!isAdmin && !staffSession) {
        console.log("[v0] Unauthorized access attempt - authentication required for record edits")
        return NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 })
      }
    }

    const supabase = await createServiceRoleClient()

    const { data: existingRecord, error: fetchError } = await supabase
      .from("entries")
      .select("*")
      .eq("id", entryId)
      .single()

    if (fetchError || !existingRecord) {
      console.error("[v0] Record not found:", entryId, fetchError)
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    if (staffSession && !isAdmin && hasOtherUpdates) {
      if (existingRecord.project_name !== staffSession.assignedProject) {
        console.log("[v0] Unauthorized - Cannot modify records outside project")
        return NextResponse.json(
          { error: "Unauthorized - Cannot modify records outside your project" },
          { status: 403 },
        )
      }
    }

    const updateFields: any = {}
    if (exitTime) updateFields.exit_time = exitTime
    if (status) updateFields.status = status

    if (status === "exited" && existingRecord.entry_time) {
      const entryTime = new Date(existingRecord.entry_time)
      const exitTimeDate = new Date(exitTime || new Date())
      const durationMs = exitTimeDate.getTime() - entryTime.getTime()
      const hours = Math.floor(durationMs / (1000 * 60 * 60))
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
      updateFields.duration = `${hours}h ${minutes}m`
    }

    // Only allow other field updates if authenticated
    if (isAdmin || staffSession) {
      if (updateData.duration) updateFields.duration = updateData.duration
      if (updateData.name) updateFields.name = updateData.name
      if (updateData.phone) updateFields.phone = updateData.phone
      if (updateData.company) updateFields.company = updateData.company
      if (updateData.vehicleNo) updateFields.vehicle_number = updateData.vehicleNo
      if (updateData.items) updateFields.items = updateData.items
      if (updateData.purpose) updateFields.purpose = updateData.purpose
      if (updateData.host) updateFields.host = updateData.host
    }

    console.log("[v0] Updating record:", entryId, "Fields:", JSON.stringify(updateFields, null, 2))

    const { data: updatedRecord, error: updateError } = await supabase
      .from("entries")
      .update(updateFields)
      .eq("id", entryId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Supabase update error:", updateError)
      return NextResponse.json({ error: "Failed to update record", details: updateError.message }, { status: 500 })
    }

    console.log("[v0] ✅ Successfully updated record:", updatedRecord.id)

    return NextResponse.json({
      success: true,
      record: updatedRecord,
    })
  } catch (error) {
    console.error("[v0] Record update error:", error)
    return NextResponse.json(
      { error: "Failed to update record", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
