import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CHILDREN_CATEGORIES } from '@/lib/categories'
import { getSessionContext } from '@/lib/auth'

export const maxDuration = 60

// GET /api/clients — list all clients (SUPER-ADMIN ONLY; agency dashboard).
export async function GET() {
  const ctx = await getSessionContext()
  if (!ctx || ctx.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*, widget_configs(category, confidence)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten the joined category onto each client
  const clients = (data || []).map((c: Record<string, unknown>) => {
    const configs = c.widget_configs as { category?: string; confidence?: number }[] | undefined
    return { ...c, category: configs?.[0]?.category || 'general_ecommerce', confidence: configs?.[0]?.confidence || null }
  })

  return NextResponse.json({ clients })
}

// POST /api/clients — persist a REVIEWED widget config (analysis already done via
// /api/onboard/analyze). No Claude call here; the operator has reviewed/edited the draft.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, domain, owner_name, owner_email, phone, plan,
      logo, tagline, colors, category, confidence, position, purposeGroups, translations,
      childrenAcknowledged,
    } = body

    if (!name || !domain || !owner_email) {
      return NextResponse.json({ error: 'name, domain, and owner_email are required' }, { status: 400 })
    }
    if (!category || !purposeGroups || !translations) {
      return NextResponse.json({ error: 'Missing reviewed config (category, purposeGroups, translations)' }, { status: 400 })
    }

    // DPDP s.9 guard — children's-data categories require explicit parental-consent handling,
    // which is not yet built. Block publish unless explicitly acknowledged (Sprint 0 gate).
    if (CHILDREN_CATEGORIES.includes(category) && !childrenAcknowledged) {
      return NextResponse.json({
        error: 'This category involves children’s data. Under DPDP Act 2023 s.9 it requires verifiable parental consent and a ban on behavioural targeting, which is not yet supported. Publishing is blocked.',
        code: 'CHILDREN_BLOCKED',
      }, { status: 422 })
    }

    // 1. Create the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name,
        domain: String(domain).replace(/^https?:\/\//, '').replace(/\/$/, ''),
        logo_url: logo || null,
        tagline: tagline || null,
        owner_name: owner_name || null,
        owner_email,
        phone: phone || null,
        plan: plan || 'free',
        onboarded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (clientError) {
      if (clientError.code === '23505') {
        return NextResponse.json({ error: 'A client with this domain or email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: clientError.message }, { status: 500 })
    }

    // 2. Save the reviewed widget config
    const { error: configError } = await supabaseAdmin
      .from('widget_configs')
      .insert({
        client_id: client.id,
        primary_color: colors?.primary || '#6c63ff',
        secondary_color: colors?.secondary || '#ffffff',
        text_color: colors?.text || '#111111',
        category,
        confidence: confidence ?? 75,
        position: position || 'bottom-right',
        purpose_groups: purposeGroups,
        translations,
        is_published: true,
        published_at: new Date().toISOString(),
        version: 1,
      })

    if (configError) {
      return NextResponse.json({ error: 'Client created but config failed: ' + configError.message }, { status: 500 })
    }

    return NextResponse.json({
      client,
      category,
      client_key: client.client_key,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
