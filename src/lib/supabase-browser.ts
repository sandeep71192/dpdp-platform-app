'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Browser Supabase client used ONLY for auth (sign in / sign up / sign out).
// Data reads go through server API routes, never directly from the browser.
//
// Lazy via Proxy: not instantiated at module load, so prerendering /login and
// /get-started during the build doesn't require env vars to be present.
let _client: SupabaseClient | null = null
function client(): SupabaseClient {
  return (_client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
}

export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get: (_t, prop) => Reflect.get(client() as object, prop),
})
