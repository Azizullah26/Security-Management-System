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
  job_id: string
}

interface StaffData {
  name: string
  email: string
  phone: string
  department: string
  company: string
  image: string
  jobPosition: string
}

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const ODOO_URL = process.env.ODOO_URL
    const ODOO_DB = process.env.ODOO_DB
    const ODOO_USERNAME = process.env.ODOO_USERNAME
    const ODOO_API_KEY = process.env.ODOO_PASSWORD

    // Validate required environment variables
    if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
      console.log("[v0] Missing Odoo configuration:")
      console.log("[v0] URL:", ODOO_URL ? "present" : "missing")
      console.log("[v0] DB:", ODOO_DB ? "present" : "missing")
      console.log("[v0] Username:", ODOO_USERNAME ? "present" : "missing")
      console.log("[v0] API Key:", ODOO_API_KEY ? "present" : "missing")
      return NextResponse.json(
        { error: "Odoo configuration is incomplete. Please check environment variables." },
        { status: 500 }
      )
    }

    // Generate alternative URLs to try if the configured one fails
    const urlsToTry = [ODOO_URL]
    
    // If URL contains test.elrace.com, try odoo.elrace.com
    if (ODOO_URL.includes('test.elrace.com')) {
      urlsToTry.push(ODOO_URL.replace('test.elrace.com', 'odoo.elrace.com'))
    }
    
    // If URL contains a subdomain, try without it
    const urlMatch = ODOO_URL.match(/https?:\/\/([^.]+)\.elrace\.com/)
    if (urlMatch && urlMatch[1] !== 'odoo') {
      urlsToTry.push(ODOO_URL.replace(`${urlMatch[1]}.elrace.com`, 'odoo.elrace.com'))
    }

    let workingUrl = ODOO_URL

    console.log("[v0] Odoo Configuration:")
    console.log("[v0] URL:", ODOO_URL)
    console.log("[v0] URLs to try:", urlsToTry)
    console.log("[v0] DB:", ODOO_DB)
    console.log("[v0] Username:", ODOO_USERNAME)
    console.log("[v0] API Key length:", ODOO_API_KEY.length)

    async function listDatabases(url: string): Promise<string[]> {
      try {
        console.log(`[v0] Attempting to list databases from: ${url}`)
        const listXml = `<?xml version="1.0"?>
<methodCall>
<methodName>list</methodName>
<params>
</params>
</methodCall>`

        const listResponse = await fetch(`${url}/xmlrpc/2/db`, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: listXml,
          signal: AbortSignal.timeout(10000),
        })

        if (!listResponse.ok) {
          console.log(`[v0] Failed to list databases from ${url}:`, listResponse.status)
          return []
        }

        const listResult = await listResponse.text()

        // Parse database names from XML response
        const dbMatches = listResult.matchAll(/<value><string>([^<]+)<\/string><\/value>/g)
        const databases: string[] = []

        for (const match of dbMatches) {
          databases.push(match[1])
        }

        console.log(`[v0] Available databases from ${url}:`, databases)
        return databases
      } catch (error) {
        console.log(`[v0] Error listing databases from ${url}:`, error instanceof Error ? error.message : String(error))
        return []
      }
    }

    async function tryAuthenticate(database: string, url: string): Promise<number | null> {
      try {
        console.log(`[v0] Attempting authentication with database: ${database} at ${url}`)

        const authXml = `<?xml version="1.0"?>
<methodCall>
<methodName>authenticate</methodName>
<params>
<param><value><string>${database}</string></value></param>
<param><value><string>${ODOO_USERNAME}</string></value></param>
<param><value><string>${ODOO_API_KEY}</string></value></param>
<param><value><struct></struct></value></param>
</params>
</methodCall>`

        const authResponse = await fetch(`${url}/xmlrpc/2/common`, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: authXml,
          signal: AbortSignal.timeout(10000),
        })

        console.log(`[v0] Auth response status for ${database} at ${url}:`, authResponse.status)

        if (!authResponse.ok) {
          console.log(`[v0] Auth failed for ${database} at ${url}: ${authResponse.status}`)
          return null
        }

        const authResult = await authResponse.text()

        if (authResult.includes("<fault>")) {
          console.log(`[v0] Auth fault for ${database} at ${url}`)
          return null
        }

        // Extract UID from XML response
        const uidMatch = authResult.match(/<value><int>(\d+)<\/int><\/value>/)
        if (!uidMatch) {
          console.log(`[v0] No UID returned for ${database} at ${url}`)
          return null
        }

        const uid = Number.parseInt(uidMatch[1])
        console.log(`[v0] ✅ Authentication successful with ${database} at ${url}, UID: ${uid}`)
        return uid
      } catch (error) {
        console.log(`[v0] Error authenticating with ${database} at ${url}:`, error instanceof Error ? error.message : String(error))
        return null
      }
    }

    let uid: number | null = null
    let workingDatabase = ODOO_DB

    // Try each URL until one works
    for (const tryUrl of urlsToTry) {
      console.log(`[v0] Trying URL: ${tryUrl}`)
      
      // Try the configured database first
      uid = await tryAuthenticate(ODOO_DB, tryUrl)

      // If configured database fails, try available databases
      if (uid === null) {
        console.log(`[v0] Configured database failed at ${tryUrl}, trying available databases...`)
        const availableDbs = await listDatabases(tryUrl)

        if (availableDbs.length > 0) {
          console.log(`[v0] Found ${availableDbs.length} available databases at ${tryUrl}, trying each...`)

          for (const db of availableDbs) {
            uid = await tryAuthenticate(db, tryUrl)
            if (uid !== null) {
              workingDatabase = db
              workingUrl = tryUrl
              console.log(`[v0] ✅ Successfully connected to database: ${db} at ${tryUrl}`)
              break
            }
          }
        }
      } else {
        workingUrl = tryUrl
        console.log(`[v0] ✅ Successfully connected with configured database at ${tryUrl}`)
        break
      }

      if (uid !== null) break
    }

    // If all URLs failed
    if (uid === null) {
      throw new Error(
        `Unable to connect to Odoo server. Tried URLs: ${urlsToTry.join(", ")}. Please update ODOO_URL environment variable to the correct server address (e.g., https://odoo.elrace.com).`,
      )
    }

    const searchEmployee = async (uid: number) => {
      console.log("[v0] Searching for employee with ID:", fileId)

      const searchXml = `<?xml version="1.0"?>
<methodCall>
<methodName>execute_kw</methodName>
<params>
<param><value><string>${workingDatabase}</string></value></param>
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
<value><string>job_id</string></value>
</data></array></value>
</member>
</struct></value></param>
</params>
</methodCall>`

      const searchResponse = await fetch(`${workingUrl}/xmlrpc/2/object`, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: searchXml,
        signal: AbortSignal.timeout(15000),
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
        job_id: extractRelationalField("job_id"),
      }

      console.log("[v0] Parsed employee data:", employee)
      return employee
    }

    // Step 1: Authenticate and get UID (already done above with fallback)
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
      phone: employee.work_phone || "", // Using work_phone directly
      department: employee.department_id || "",
      company: employee.company_id || "",
      image: employee.image_1920 ? `data:image/png;base64,${employee.image_1920}` : "/placeholder.svg",
      jobPosition: employee.job_id || "",
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
