import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured - running in UI preview mode")
    // Return null for UI preview mode
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server component, cookies are read-only
        }
      },
    },
  })
}

// Server-side privileged client using Service Role key for writes under RLS.
// Do NOT expose the service role key to the browser.
export function getSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase service role not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.")
    return null
  }

  // Use SSR client without cookies; service role bypasses RLS.
  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() { return [] },
      setAll() { /* no-op */ },
    },
  })
}
