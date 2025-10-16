// Environment variable validation for production builds
export function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "ADMIN_PASSWORD"]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(", ")}`)
    console.warn("Some features may not work correctly.")
  }

  return missing.length === 0
}

// Safe environment variable getter with fallback
export function getEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback
}
