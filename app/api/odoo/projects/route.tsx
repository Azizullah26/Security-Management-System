import { type NextRequest, NextResponse } from "next/server"

interface OdooProject {
  id: number
  name: string
  wo_ref_no?: string
  project_status?: string
  partner_id?: string // Added partner_id field for client information
  agreement_id?: string // Added agreement_id field for agreement information
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching projects from Odoo...")

    const ODOO_URL = process.env.ODOO_URL || "https://test.elrace.com"
    const ODOO_DB = process.env.ODOO_DB || "test.elrace.com"
    const ODOO_USERNAME = process.env.ODOO_USERNAME || "jawad"
    const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "272127212721"

    console.log("[v0] Odoo Configuration:")
    console.log("[v0] URL:", ODOO_URL)
    console.log("[v0] DB:", ODOO_DB)
    console.log("[v0] Username:", ODOO_USERNAME)

    // Step 1: Authenticate
    console.log("[v0] Attempting XML-RPC authentication...")

    const authXml = `<?xml version="1.0"?>
<methodCall>
<methodName>authenticate</methodName>
<params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><string>${ODOO_USERNAME}</string></value></param>
<param><value><string>${ODOO_PASSWORD}</string></value></param>
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
      throw new Error(`Authentication failed: ${authResponse.status}`)
    }

    const authResult = await authResponse.text()

    if (authResult.includes("<fault>")) {
      console.log("[v0] Authentication failed - fault in response")
      const faultMatch = authResult.match(/<string>([^<]+)<\/string>/)
      const faultMsg = faultMatch ? faultMatch[1] : "Unknown error"
      throw new Error(`Authentication failed: ${faultMsg}`)
    }

    const uidMatch = authResult.match(/<value><int>(\d+)<\/int><\/value>/)
    if (!uidMatch) {
      throw new Error("Authentication failed - no UID returned")
    }

    const uid = Number.parseInt(uidMatch[1])
    console.log("[v0] Authentication successful, UID:", uid)

    // Step 2: Search for all projects
    console.log("[v0] Fetching all projects from Odoo...")

    const searchXml = `<?xml version="1.0"?>
<methodCall>
<methodName>execute_kw</methodName>
<params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><int>${uid}</int></value></param>
<param><value><string>${ODOO_PASSWORD}</string></value></param>
<param><value><string>project.project</string></value></param>
<param><value><string>search_read</string></value></param>
<param><value><array><data>
<value><array><data></data></array></value>
</data></array></value></param>
<param><value><struct>
<member>
<name>fields</name>
<value><array><data>
<value><string>id</string></value>
<value><string>name</string></value>
<value><string>wo_ref_no</string></value>
<value><string>project_status</string></value>
<value><string>partner_id</string></value>
<value><string>agreement_id</string></value>
</data></array></value>
</member>
<member>
<name>limit</name>
<value><int>1000</int></value>
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
      throw new Error(`Search failed: ${searchResponse.status}`)
    }

    const searchResult = await searchResponse.text()
    console.log("[v0] Search response length:", searchResult.length)

    if (searchResult.includes("<fault>")) {
      console.log("[v0] Search failed - fault in response")

      const faultStringMatch = searchResult.match(
        /<member>\s*<name>faultString<\/name>\s*<value><string>([^<]+)<\/string><\/value>/s,
      )
      const faultCodeMatch = searchResult.match(
        /<member>\s*<name>faultCode<\/name>\s*<value><int>(\d+)<\/int><\/value>/s,
      )

      const faultMsg = faultStringMatch ? faultStringMatch[1] : "Unknown error"
      const faultCode = faultCodeMatch ? faultCodeMatch[1] : "Unknown"

      console.log("[v0] Fault Code:", faultCode)
      console.log("[v0] Fault Message:", faultMsg)

      if (faultMsg.includes("Access Denied") || faultMsg.includes("AccessError")) {
        throw new Error("Access Denied - User may not have permission to access project records")
      }
      if (faultMsg.includes("does not exist") || faultMsg.includes("model not found")) {
        throw new Error("Project model not found - project.project may not be installed in this Odoo instance")
      }

      throw new Error(`Odoo error: ${faultMsg}`)
    }

    // Step 3: Parse projects from XML response
    console.log("[v0] Parsing projects from XML response...")

    const projects: Array<{
      id: string
      name: string
      woNumber?: string
      status: string
      client?: string
      agreement?: string
    }> = []

    const structMatches = searchResult.matchAll(/<struct>([\s\S]*?)<\/struct>/g)

    let structCount = 0
    const allProjectStatuses: string[] = []

    for (const structMatch of structMatches) {
      structCount++
      const structContent = structMatch[1]

      // Log first struct to see XML structure
      if (structCount === 1) {
        console.log("[v0] First struct content (truncated):", structContent.substring(0, 500))
      }

      const nameMatch = structContent.match(/<name>name<\/name>\s*<value><string>([^<]*)<\/string><\/value>/)
      const idMatch = structContent.match(/<name>id<\/name>\s*<value><int>(\d+)<\/int><\/value>/)
      const woRefNoMatch = structContent.match(/<name>wo_ref_no<\/name>\s*<value><string>([^<]*)<\/string><\/value>/)

      const projectStatusArrayMatch = structContent.match(
        /<name>project_status<\/name>\s*<value><array><data>\s*<value><int>\d+<\/int><\/value>\s*<value><string>([^<]*)<\/string><\/value>/,
      )
      const projectStatusStringMatch = structContent.match(
        /<name>project_status<\/name>\s*<value><string>([^<]*)<\/string><\/value>/,
      )

      const partnerIdArrayMatch = structContent.match(
        /<name>partner_id<\/name>\s*<value><array><data>\s*<value><int>\d+<\/int><\/value>\s*<value><string>([^<]*)<\/string><\/value>/,
      )
      const partnerIdStringMatch = structContent.match(
        /<name>partner_id<\/name>\s*<value><string>([^<]*)<\/string><\/value>/,
      )

      const agreementIdArrayMatch = structContent.match(
        /<name>agreement_id<\/name>\s*<value><array><data>\s*<value><int>\d+<\/int><\/value>\s*<value><string>([^<]*)<\/string><\/value>/,
      )
      const agreementIdStringMatch = structContent.match(
        /<name>agreement_id<\/name>\s*<value><string>([^<]*)<\/string><\/value>/,
      )

      if (nameMatch && idMatch) {
        const projectName = nameMatch[1]
        const woNumber = woRefNoMatch ? woRefNoMatch[1] : undefined
        const projectStatus = projectStatusArrayMatch
          ? projectStatusArrayMatch[1]
          : projectStatusStringMatch
            ? projectStatusStringMatch[1]
            : "unknown"

        const clientName = partnerIdArrayMatch
          ? partnerIdArrayMatch[1]
          : partnerIdStringMatch
            ? partnerIdStringMatch[1]
            : undefined

        const agreementName = agreementIdArrayMatch
          ? agreementIdArrayMatch[1]
          : agreementIdStringMatch
            ? agreementIdStringMatch[1]
            : undefined

        // Collect all statuses for debugging
        if (projectStatus && !allProjectStatuses.includes(projectStatus)) {
          allProjectStatuses.push(projectStatus)
        }

        projects.push({
          id: `odoo-${idMatch[1]}`,
          name: projectName,
          woNumber: woNumber || undefined,
          status: "active", // Map all to "active" status for now
          client: clientName, // Added client field
          agreement: agreementName, // Added agreement field
        })

        // Log first 5 projects for debugging
        if (projects.length <= 5) {
          console.log(
            `[v0] Project ${projects.length}: ${projectName} (W.O: ${woNumber || "N/A"}, Status: ${projectStatus}, Client: ${clientName || "N/A"}, Agreement: ${agreementName || "N/A"})`,
          )
        }
      }
    }

    console.log("[v0] Total struct elements found:", structCount)
    console.log("[v0] All unique project statuses found:", JSON.stringify(allProjectStatuses))
    console.log("[v0] Successfully parsed", projects.length, "projects from Odoo")

    return NextResponse.json({
      success: true,
      projects: projects,
      count: projects.length,
    })
  } catch (error) {
    console.error("[v0] Odoo Projects API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        projects: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
