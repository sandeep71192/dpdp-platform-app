import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

// Server client (with cookies for auth) — created per request, already lazy.
export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Lazy singletons via Proxy: the underlying client is NOT created at module load
// (which would crash the Vercel build before env vars are available). It is created
// on first property access at runtime, where env vars exist.
function lazyClient(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null
  const get = () => (instance ??= factory())
  return new Proxy({} as SupabaseClient, {
    get: (_t, prop) => Reflect.get(get() as object, prop),
  })
}

// Browser/anon client (used for auth helpers).
export const supabase = lazyClient(() =>
  createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
)

// Admin client (bypasses RLS — server only).
export const supabaseAdmin = lazyClient(() =>
  createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
)
