import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Helper function to make fetch requests with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function connectToOdoo(url: string) {
  const ODOO_DB = process.env.ODOO_DB || "odoo.elrace.com"
  const ODOO_USERNAME = process.env.ODOO_USERNAME
  const ODOO_PASSWORD = process.env.ODOO_PASSWORD

  if (!ODOO_USERNAME || !ODOO_PASSWORD) {
    console.error("[v0] Missing Odoo credentials in environment variables")
    return null
  }

  const authPayload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "authenticate",
      args: [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}],
    },
    id: Math.random(),
  }

  try {
    console.log(`[v0] Attempting Odoo authentication at ${url} with DB: ${ODOO_DB}`)
    const response = await fetchWithTimeout(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authPayload),
    }, 8000)

    const data = await response.json()
    if (data.result && typeof data.result === "number") {
      console.log(`[v0] ✅ Odoo auth successful, UID: ${data.result}`)
      return { url, uid: data.result, db: ODOO_DB }
    }
    console.log(`[v0] ❌ Odoo auth failed:`, data.error?.data?.message || "Invalid response")
    return null
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.log(`[v0] ❌ Odoo connection timed out after 8 seconds`)
      } else {
        console.log(`[v0] ❌ Connection failed:`, error.message)
      }
    } else {
      console.log(`[v0] ❌ Connection failed:`, String(error))
    }
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const connection = await connectToOdoo("https://erp.elrace.com")

    if (!connection) {
      console.warn("[v0] Could not connect to Odoo ERP - returning empty projects list")
      return NextResponse.json({ success: false, projects: [], error: "Could not connect to Odoo" })
    }

    const { url, uid, db } = connection
    const password = process.env.ODOO_PASSWORD

    // Removed x_wo_no and wo_ref_no as they are custom fields that may not exist
    const basicFields = [
      "id",
      "name",
      "display_name",
      "active",
      "partner_id", // Client
      "user_id", // Project Manager
      "date_start",
      "date",
      "analytic_account_id",
    ]

    console.log(`[v0] Fetching projects from Odoo with standard fields...`)

    const searchReadPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          db,
          uid,
          password,
          "project.project",
          "search_read",
          [[]], // Empty domain = all records (active and inactive)
          {
            fields: basicFields,
            context: { active_test: false }, // Include archived/inactive projects too
          },
        ],
      },
      id: Math.random(),
    }

    const response = await fetchWithTimeout(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchReadPayload),
    }, 10000)

    const data = await response.json()

    if (data.error) {
      console.error("[v0] Odoo search_read error:", data.error.data?.message || data.error.message || data.error)

      console.log("[v0] Retrying with minimal fields...")

      const minimalPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            db,
            uid,
            password,
            "project.project",
            "search_read",
            [[]],
            {
              fields: ["id", "name", "display_name", "active", "partner_id"],
              context: { active_test: false },
            },
          ],
        },
        id: Math.random(),
      }

      const retryResponse = await fetchWithTimeout(`${url}/jsonrpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minimalPayload),
      }, 10000)

      const retryData = await retryResponse.json()

      if (retryData.error) {
        console.error("[v0] Retry also failed:", retryData.error.data?.message || retryData.error)
        return NextResponse.json({ success: false, projects: [], error: "Odoo query failed" })
      }

      if (retryData.result && Array.isArray(retryData.result)) {
        console.log(`[v0] Retry successful, received ${retryData.result.length} projects with minimal fields`)

        const projects = retryData.result.map((project: any) => ({
          id: `odoo-${project.id}`,
          name: project.name || project.display_name || "Unnamed Project",
          status: project.active === false ? "cancelled" : "active",
          client: project.partner_id?.[1] || undefined,
        }))

        return NextResponse.json(
          { success: true, projects },
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        )
      }
    }

    if (!data.result || !Array.isArray(data.result)) {
      console.warn("[v0] No projects returned from Odoo")
      return NextResponse.json({ success: true, projects: [] })
    }

    if (data.result.length > 0) {
      const sampleProject = data.result[0]
      console.log("[v0] Sample project fields:", Object.keys(sampleProject).join(", "))
      console.log("[v0] Sample project:", JSON.stringify(sampleProject).substring(0, 500))
    }

    console.log(`[v0] Received ${data.result.length} projects from Odoo`)

    const projects = data.result.map((project: any) => {
      const name = project.name || project.display_name || "Unnamed Project"

      // Client - Many2one field returns [id, name]
      const client = project.partner_id?.[1] || undefined

      // Agreement/Contract
      const agreement = project.agreement_id?.[1] || project.analytic_account_id?.[1] || undefined

      let status = "active"
      if (project.active === false) {
        status = "cancelled"
      }

      return {
        id: `odoo-${project.id}`,
        name,
        status,
        client,
        agreement,
      }
    })

    console.log(`[v0] Successfully mapped ${projects.length} projects from Odoo`)

    return NextResponse.json(
      { success: true, projects },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching Odoo projects:", error)
    return NextResponse.json(
      { success: false, projects: [], error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const connection = await connectToOdoo("https://erp.elrace.com")

    if (!connection) {
      console.warn("[v0] Could not connect to Odoo ERP")
      return NextResponse.json({ success: false, projects: [], error: "Could not connect to Odoo" })
    }

    const { url, uid, db } = connection
    const password = process.env.ODOO_PASSWORD

    // Removed x_wo_no and wo_ref_no as they are custom fields that may not exist
    const basicFields = [
      "id",
      "name",
      "display_name",
      "active",
      "partner_id", // Client
      "user_id", // Project Manager
      "date_start",
      "date",
      "analytic_account_id",
    ]

    console.log(`[v0] Fetching projects from Odoo with standard fields...`)

    const searchReadPayload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          db,
          uid,
          password,
          "project.project",
          "search_read",
          [[]], // Empty domain = all records (active and inactive)
          {
            fields: basicFields,
            context: { active_test: false }, // Include archived/inactive projects too
          },
        ],
      },
      id: Math.random(),
    }

    const response = await fetch(`${url}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchReadPayload),
    })

    const data = await response.json()

    if (data.error) {
      console.error("[v0] Odoo search_read error:", data.error.data?.message || data.error.message || data.error)

      console.log("[v0] Retrying with minimal fields...")

      const minimalPayload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            db,
            uid,
            password,
            "project.project",
            "search_read",
            [[]],
            {
              fields: ["id", "name", "display_name", "active", "partner_id"],
              context: { active_test: false },
            },
          ],
        },
        id: Math.random(),
      }

      const retryResponse = await fetch(`${url}/jsonrpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(minimalPayload),
      })

      const retryData = await retryResponse.json()

      if (retryData.error) {
        console.error("[v0] Retry also failed:", retryData.error.data?.message || retryData.error)
        return NextResponse.json({ success: false, projects: [], error: "Odoo query failed" })
      }

      if (retryData.result && Array.isArray(retryData.result)) {
        console.log(`[v0] Retry successful, received ${retryData.result.length} projects with minimal fields`)

        const projects = retryData.result.map((project: any) => ({
          id: `odoo-${project.id}`,
          name: project.name || project.display_name || "Unnamed Project",
          status: project.active === false ? "cancelled" : "active",
          client: project.partner_id?.[1] || undefined,
        }))

        return NextResponse.json(
          { success: true, projects },
          {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        )
      }
    }

    if (!data.result || !Array.isArray(data.result)) {
      console.warn("[v0] No projects returned from Odoo")
      return NextResponse.json({ success: true, projects: [] })
    }

    if (data.result.length > 0) {
      const sampleProject = data.result[0]
      console.log("[v0] Sample project fields:", Object.keys(sampleProject).join(", "))
      console.log("[v0] Sample project:", JSON.stringify(sampleProject).substring(0, 500))
    }

    console.log(`[v0] Received ${data.result.length} projects from Odoo`)

    const projects = data.result.map((project: any) => {
      const name = project.name || project.display_name || "Unnamed Project"

      // Client - Many2one field returns [id, name]
      const client = project.partner_id?.[1] || undefined

      // Agreement/Contract
      const agreement = project.agreement_id?.[1] || project.analytic_account_id?.[1] || undefined

      let status = "active"
      if (project.active === false) {
        status = "cancelled"
      }

      return {
        id: `odoo-${project.id}`,
        name,
        status,
        client,
        agreement,
      }
    })

    console.log(`[v0] Successfully mapped ${projects.length} projects from Odoo`)

    return NextResponse.json(
      { success: true, projects },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching Odoo projects:", error)
    return NextResponse.json(
      { success: false, projects: [], error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
