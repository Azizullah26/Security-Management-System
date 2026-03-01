import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split(".").pop()
    const fileName = `${timestamp}-${randomString}.${fileExt}`

    console.log("[v0] Uploading file to Supabase Storage:", fileName)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("securityreport").upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload error:", error)
      return NextResponse.json({ error: "Failed to upload file", details: error.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("securityreport").getPublicUrl(fileName)

    console.log("[v0] File uploaded successfully:", publicUrl)
    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
