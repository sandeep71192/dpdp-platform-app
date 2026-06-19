import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/portal?key=CLIENT_KEY — client + config, scoped to the owning session.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, domain, logo_url, tagline, plan, client_key, is_active, created_at')
    .eq('client_key', key)
    .single()

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Authorization: only this brand's account (or a super-admin) may read it.
  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('*')
    .eq('client_id', client.id)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  // Widget health: timestamp of the most recent consent event for this client.
  // Null means the widget has never reported in (not yet installed / not firing).
  const { data: lastEvent } = await supabaseAdmin
    .from('consent_events')
    .select('created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ client, config, lastEventAt: lastEvent?.created_at ?? null })
}

// PATCH /api/portal?key=CLIENT_KEY — update the site domain (used when deploying to production).
export async function PATCH(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('client_key', key)
    .single()

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const domain = typeof body.domain === 'string' ? body.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim() : null
  if (!domain) return NextResponse.json({ error: 'domain is required' }, { status: 400 })

  const { error: updateErr } = await supabaseAdmin
    .from('clients')
    .update({ domain })
    .eq('id', client.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, domain })
}
