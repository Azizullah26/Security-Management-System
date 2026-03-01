import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client using the best available key.
 * Falls back to anon key if service role key is not set.
 * Use this in all API routes for consistent database access.
 */
export function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      `Supabase configuration missing. URL: ${!!url}, Key: ${!!key}`
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
