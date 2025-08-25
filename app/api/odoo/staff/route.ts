import { type NextRequest, NextResponse } from "next/server"

interface OdooStaffResponse {
  id: number
  name: string
  work_email: string
  work_phone: string
  department_id: [number, string]
  company_id: [number, string]
  image_1920?: string
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

    // Odoo configuration - these should be environment variables
    const ODOO_URL = process.env.ODOO_URL || "https://your-odoo-instance.com"
    const ODOO_DB = process.env.ODOO_DB || "your-database"
    const ODOO_USERNAME = process.env.ODOO_USERNAME || "your-username"
    const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "your-password"

    // Step 1: Authenticate with Odoo
    const authResponse = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: ODOO_DB,
          login: ODOO_USERNAME,
          password: ODOO_PASSWORD,
        },
      }),
    })

    const authData = await authResponse.json()

    if (!authData.result || !authData.result.uid) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    const sessionId = authData.result.session_id
    const uid = authData.result.uid

    // Step 2: Search for employee by File ID (assuming File ID is stored in employee_id field)
    const searchResponse = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "hr.employee",
          method: "search_read",
          args: [
            [["employee_id", "=", fileId]], // Search by employee ID field
            ["name", "work_email", "work_phone", "department_id", "company_id", "image_1920"],
          ],
          kwargs: {
            context: { uid: uid },
          },
        },
      }),
    })

    const searchData = await searchResponse.json()

    if (!searchData.result || searchData.result.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const employee: OdooStaffResponse = searchData.result[0]

    // Step 3: Format the response data
    const staffData: StaffData = {
      name: employee.name || "",
      email: employee.work_email || "",
      phone: employee.work_phone || "",
      department: employee.department_id ? employee.department_id[1] : "",
      company: employee.company_id ? employee.company_id[1] : "",
      image: employee.image_1920 ? `data:image/png;base64,${employee.image_1920}` : "/placeholder.svg",
    }

    return NextResponse.json({ success: true, data: staffData })
  } catch (error) {
    console.error("Odoo API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
