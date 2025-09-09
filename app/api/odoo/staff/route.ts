import { type NextRequest, NextResponse } from "next/server"

interface OdooStaffResponse {
  id: number
  name: string
  work_email: string
  work_phone: string
  department: string
  company: string
  image: string
  emp_id: string
}

interface StaffData {
  name: string
  email: string
  phone: string
  department: string
  company: string
  image: string
}

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const ODOO_URL = "https://erp.elrace.com"
    const ODOO_DB = "odoo.elrace.com"
    const ODOO_USERNAME = "jawad"
    const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "272127212721"

    console.log("[v0] Odoo Configuration:")
    console.log("[v0] URL:", ODOO_URL)
    console.log("[v0] DB:", ODOO_DB)
    console.log("[v0] Username:", ODOO_USERNAME)
    console.log("[v0] Password length:", ODOO_PASSWORD.length)

    try {
      console.log("[v0] Attempting authentication with correct JSON-RPC format")

      const authResponse = await fetch(`${ODOO_URL}/web/session/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: ODOO_DB,
            login: ODOO_USERNAME,
            password: ODOO_PASSWORD,
          },
          id: Math.floor(Math.random() * 1000000),
        }),
      })

      console.log("[v0] Auth response status:", authResponse.status)
      console.log("[v0] Auth response headers:", Object.fromEntries(authResponse.headers.entries()))

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.log("[v0] Auth error response:", errorText)
        return NextResponse.json(
          { error: `Authentication failed: ${authResponse.status} ${errorText}` },
          { status: 401 },
        )
      }

      const contentType = authResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await authResponse.text()
        console.log("[v0] Non-JSON auth response:", errorText)
        return NextResponse.json({ error: `Non-JSON response: ${errorText}` }, { status: 500 })
      }

      const authData = await authResponse.json()
      console.log("[v0] Auth response data:", authData)

      if (authData.error) {
        console.log("[v0] Authentication error:", authData.error)
        return NextResponse.json(
          { error: `Authentication failed: ${authData.error.message || "Invalid credentials"}` },
          { status: 401 },
        )
      }

      if (!authData.result || !authData.result.uid) {
        console.log("[v0] Authentication failed - no UID returned")
        return NextResponse.json({ error: "Authentication failed - invalid credentials" }, { status: 401 })
      }

      const uid = authData.result.uid
      console.log("[v0] Authentication successful, UID:", uid)

      const searchResponse = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: authResponse.headers.get("set-cookie") || "",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            model: "hr.employee",
            method: "search_read",
            args: [],
            kwargs: {
              domain: [["emp_id", "=", fileId]],
              fields: [
                "id",
                "name",
                "work_email",
                "mobile_phone",
                "section_id",
                "default_unit_operating_id",
                "image_1920",
                "emp_id",
              ],
            },
          },
          id: Math.floor(Math.random() * 1000000),
        }),
      })

      console.log("[v0] Search response status:", searchResponse.status)

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.log("[v0] Search error response:", errorText)
        return NextResponse.json(
          { error: `Search request failed: ${searchResponse.status} ${searchResponse.statusText}` },
          { status: 500 },
        )
      }

      const searchContentType = searchResponse.headers.get("content-type")
      if (!searchContentType || !searchContentType.includes("application/json")) {
        const errorText = await searchResponse.text()
        console.log("[v0] Non-JSON search response:", errorText)
        return NextResponse.json({ error: "Odoo search returned non-JSON response" }, { status: 500 })
      }

      const searchData = await searchResponse.json()
      console.log("[v0] Search response data:", searchData)

      if (searchData.error) {
        console.log("[v0] Odoo search error:", searchData.error)
        return NextResponse.json(
          { error: `Odoo error: ${searchData.error.message || "Unknown error"}` },
          { status: 500 },
        )
      }

      if (!searchData.result || searchData.result.length === 0) {
        console.log("[v0] No employee found with ID:", fileId)
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
      }

      const employee = searchData.result[0]
      console.log("[v0] Found employee:", employee)

      const staffData: StaffData = {
        name: employee.name || "",
        email: employee.work_email || "",
        phone: employee.mobile_phone || "",
        department: employee.section_id ? employee.section_id[1] : "",
        company: employee.default_unit_operating_id ? employee.default_unit_operating_id[1] : "",
        image: employee.image_1920 ? `data:image/png;base64,${employee.image_1920}` : "/placeholder.svg",
      }

      console.log("[v0] Returning staff data:", staffData)
      return NextResponse.json({ success: true, data: staffData })
    } catch (error) {
      console.error("[v0] Authentication/Search Error:", error)
      return NextResponse.json(
        { error: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Odoo API Error:", error)
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "Odoo returned invalid JSON response. Check Odoo server configuration and API endpoints." },
        { status: 500 },
      )
    }
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
