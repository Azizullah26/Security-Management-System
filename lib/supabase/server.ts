import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side operations
 * Important: Don't put this client in a global variable for Fluid compute compatibility
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Creates a Supabase client with service role privileges
 * This bypasses Row Level Security (RLS) and should only be used in secure backend contexts
 * Use this for API routes that need full database access
 */
export async function createServiceRoleClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore cookie setting errors in Server Components
        }
      },
    },
  })
}
