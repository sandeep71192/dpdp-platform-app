import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH /api/portal/config — a brand edits & re-publishes its own widget.
// Scoped to the owning session (or super-admin). Bumps the config version.
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { key, primary_color, position, purposeGroups } = body
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('client_key', key)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Load the current published config (to bump its version).
  const { data: current } = await supabaseAdmin
    .from('widget_configs')
    .select('id, version')
    .eq('client_id', client.id)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()
  if (!current) return NextResponse.json({ error: 'No published config to edit' }, { status: 404 })

  // Only allow the editable fields through; leave translations/category untouched here.
  const update: Record<string, unknown> = {
    version: (current.version || 1) + 1,
    published_at: new Date().toISOString(),
  }
  if (typeof primary_color === 'string') update.primary_color = primary_color
  if (typeof position === 'string') update.position = position
  if (Array.isArray(purposeGroups)) update.purpose_groups = purposeGroups

  const { error } = await supabaseAdmin
    .from('widget_configs')
    .update(update)
    .eq('id', current.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, version: update.version })
}
