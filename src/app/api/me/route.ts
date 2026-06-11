import { NextResponse } from 'next/server'
import { getSessionContext } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/me — current session: role, client scope, and client_key for redirects.
export async function GET() {
  const ctx = await getSessionContext()
  if (!ctx) return NextResponse.json({ authenticated: false }, { status: 401 })

  let client_key: string | null = null
  if (ctx.clientId) {
    const { data } = await supabaseAdmin.from('clients').select('client_key').eq('id', ctx.clientId).single()
    client_key = data?.client_key ?? null
  }
  return NextResponse.json({ authenticated: true, role: ctx.role, clientId: ctx.clientId, email: ctx.email, client_key })
}
