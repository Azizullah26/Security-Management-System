import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

// This endpoint should be called once to hash and store staff passwords from environment variables
export async function POST() {
  try {
    const supabase = await createServiceRoleClient()

    // Get passwords from environment variables
    const staffCredentials = [
      { fileId: "3252", name: "Mohus", password: process.env.STAFF_3252_PASSWORD },
      { fileId: "3242", name: "Umair", password: process.env.STAFF_3242_PASSWORD },
      { fileId: "3253", name: "Salman", password: process.env.STAFF_3253_PASSWORD },
      { fileId: "2234", name: "Tanweer", password: process.env.STAFF_2234_PASSWORD },
      { fileId: "3245", name: "Tilak", password: process.env.STAFF_3245_PASSWORD },
      { fileId: "3248", name: "Ramesh", password: process.env.STAFF_3248_PASSWORD },
    ]

    const results = []

    for (const staff of staffCredentials) {
      if (!staff.password) {
        results.push({
          fileId: staff.fileId,
          name: staff.name,
          status: "error",
          message: "Password not found in environment variables",
        })
        continue
      }

      // Hash the password using Web Crypto API (available in Next.js)
      const passwordHash = await hashPassword(staff.password)

      // Update the profile with the hashed password
      const { error } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash })
        .eq("file_id", staff.fileId)

      if (error) {
        results.push({
          fileId: staff.fileId,
          name: staff.name,
          status: "error",
          message: error.message,
        })
      } else {
        results.push({
          fileId: staff.fileId,
          name: staff.name,
          status: "success",
          message: "Password hashed and stored successfully",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Staff passwords setup completed",
      results,
    })
  } catch (error) {
    console.error("[v0] Error setting up staff passwords:", error)
    return NextResponse.json({ success: false, error: "Failed to setup staff passwords" }, { status: 500 })
  }
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}
