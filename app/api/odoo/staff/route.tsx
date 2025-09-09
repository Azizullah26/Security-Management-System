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

    const ODOO_URL = "https://test.elrace.com"
    const ODOO_DB = "test.elrace.com" // Only use the confirmed database name
    const ODOO_USERNAME = "jawad"
    const ODOO_API_KEY = "272127212721" // This should be an API key generated from Odoo user settings

    console.log("[v0] Odoo Configuration:")
    console.log("[v0] URL:", ODOO_URL)
    console.log("[v0] DB:", ODOO_DB)
    console.log("[v0] Username:", ODOO_USERNAME)
    console.log("[v0] API Key length:", ODOO_API_KEY.length)

    const authenticate = async () => {
      console.log("[v0] Attempting XML-RPC authentication with API key...")

      const authXml = `<?xml version="1.0"?>
<methodCall>
<methodName>authenticate</methodName>
<params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><string>${ODOO_USERNAME}</string></value></param>
<param><value><string>${ODOO_API_KEY}</string></value></param>
<param><value><struct></struct></value></param>
</params>
</methodCall>`

      const authResponse = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: authXml,
      })

      console.log("[v0] Auth response status:", authResponse.status)

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
      }

      const authResult = await authResponse.text()
      console.log("[v0] Auth response:", authResult)

      if (authResult.includes("<fault>")) {
        console.log("[v0] Authentication failed - fault in response")
        throw new Error("Authentication failed - invalid credentials or permissions")
      }

      // Extract UID from XML response
      const uidMatch = authResult.match(/<value><int>(\d+)<\/int><\/value>/)
      if (!uidMatch) {
        throw new Error("Authentication failed - no UID returned")
      }

      const uid = Number.parseInt(uidMatch[1])
      console.log("[v0] Authentication successful, UID:", uid)
      return uid
    }

    const searchEmployee = async (uid: number) => {
      console.log("[v0] Searching for employee with ID:", fileId)

      const searchXml = `<?xml version="1.0"?>
<methodCall>
<methodName>execute_kw</methodName>
<params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><int>${uid}</int></value></param>
<param><value><string>${ODOO_API_KEY}</string></value></param>
<param><value><string>hr.employee</string></value></param>
<param><value><string>search_read</string></value></param>
<param><value><array><data>
<value><array><data>
<value><array><data>
<value><string>emp_id</string></value>
<value><string>=</string></value>
<value><string>${fileId}</string></value>
</data></array></value>
</data></array></value>
</data></array></value></param>
<param><value><struct>
<member>
<name>fields</name>
<value><array><data>
<value><string>id</string></value>
<value><string>name</string></value>
<value><string>work_email</string></value>
<value><string>work_phone</string></value>
<value><string>department_id</string></value>
<value><string>company_id</string></value>
<value><string>image_1920</string></value>
<value><string>emp_id</string></value>
</data></array></value>
</member>
</struct></value></param>
</params>
</methodCall>`

      const searchResponse = await fetch(`${ODOO_URL}/xmlrpc/2/object`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: searchXml,
      })

      console.log("[v0] Search response status:", searchResponse.status)

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`)
      }

      const searchResult = await searchResponse.text()
      console.log("[v0] Search response:", searchResult.substring(0, 1000) + "...")

      if (searchResult.includes("<fault>")) {
        console.log("[v0] Search failed - fault in response")
        if (searchResult.includes("Access Denied")) {
          throw new Error("Access Denied - User may not have permission to access HR Employee records")
        }
        throw new Error("Search failed - server error")
      }

      return searchResult
    }

    const parseEmployeeData = (xmlResponse: string) => {
      console.log("[v0] Parsing employee data from XML response")

      // Check if no results found
      if (xmlResponse.includes("<array><data></data></array>")) {
        return null
      }

      // Extract employee fields from XML
      const extractField = (fieldName: string) => {
        const patterns = [
          new RegExp(`<name>${fieldName}</name>\\s*<value><string>([^<]*)</string></value>`, "i"),
          new RegExp(`<name>${fieldName}</name>\\s*<value>([^<]*)</value>`, "i"),
        ]

        for (const pattern of patterns) {
          const match = xmlResponse.match(pattern)
          if (match) return match[1]
        }
        return ""
      }

      const extractRelationalField = (fieldName: string) => {
        const pattern = new RegExp(
          `<name>${fieldName}</name>\\s*<value><array><data>\\s*<value><int>\\d+</int></value>\\s*<value><string>([^<]*)</string></value>`,
          "i",
        )
        const match = xmlResponse.match(pattern)
        return match ? match[1] : ""
      }

      const employee = {
        name: extractField("name"),
        work_email: extractField("work_email"),
        work_phone: extractField("work_phone"),
        department_id: extractRelationalField("department_id"),
        company_id: extractRelationalField("company_id"),
        image_1920: extractField("image_1920"),
        emp_id: extractField("emp_id"),
      }

      console.log("[v0] Parsed employee data:", employee)
      return employee
    }

    // Step 1: Authenticate and get UID
    const uid = await authenticate()

    // Step 2: Search for employee using stateless XML-RPC
    const searchResult = await searchEmployee(uid)

    // Step 3: Parse employee data from XML response
    const employee = parseEmployeeData(searchResult)

    if (!employee) {
      console.log("[v0] No employee found with ID:", fileId)
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const staffData: StaffData = {
      name: employee.name || "",
      email: employee.work_email || "",
      phone: employee.work_phone || "",
      department: employee.department_id || "",
      company: employee.company_id || "",
      image: employee.image_1920 ? `data:image/png;base64,${employee.image_1920}` : "/placeholder.svg",
    }

    console.log("[v0] Returning staff data:", staffData)
    return NextResponse.json({ success: true, data: staffData })
  } catch (error) {
    console.error("[v0] Odoo API Error:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
