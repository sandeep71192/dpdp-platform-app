'use client'
import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client used ONLY for auth (sign in / sign up / sign out).
// Data reads go through server API routes, never directly from the browser.
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
