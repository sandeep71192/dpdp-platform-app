import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CHILDREN_CATEGORIES } from '@/lib/categories'

export const maxDuration = 60

// POST /api/signup — self-serve brand onboarding.
// Creates an auth account + client + platform_user (client_admin) + published widget config.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email, password, name, domain, owner_name, phone,
      logo, tagline, colors, category, confidence, position, font, layout, heroImage, purposeGroups, translations,
      childrenAcknowledged,
    } = body

    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    if (!name || !domain || !category || !purposeGroups || !translations) {
      return NextResponse.json({ error: 'Missing reviewed widget config' }, { status: 400 })
    }
    if (CHILDREN_CATEGORIES.includes(category) && !childrenAcknowledged) {
      return NextResponse.json({ error: 'This category involves children’s data (DPDP s.9) and cannot be self-published yet.', code: 'CHILDREN_BLOCKED' }, { status: 422 })
    }

    const cleanDomain = String(domain).replace(/^https?:\/\//, '').replace(/\/$/, '')

    // 1. Create the auth user (email pre-confirmed for MVP — no email round-trip).
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { name: owner_name || name },
    })
    if (authErr || !authData.user) {
      const msg = authErr?.message || 'Could not create account'
      const status = /already/i.test(msg) ? 409 : 400
      return NextResponse.json({ error: msg.includes('already') ? 'An account with this email already exists. Please log in.' : msg }, { status })
    }
    const authUserId = authData.user.id

    // Helper to roll back the auth user if a later step fails.
    const rollback = async () => { await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => {}) }

    // 2. Create the client.
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .insert({
        name, domain: cleanDomain, logo_url: logo || null, tagline: tagline || null,
        owner_name: owner_name || null, owner_email: email, phone: phone || null,
        plan: 'free', onboarded_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (clientErr) {
      await rollback()
      const status = clientErr.code === '23505' ? 409 : 500
      return NextResponse.json({ error: clientErr.code === '23505' ? 'A widget for this domain already exists.' : clientErr.message }, { status })
    }

    // 3. Link the auth user to this client as client_admin.
    const { error: puErr } = await supabaseAdmin.from('platform_users').insert({
      email, name: owner_name || name, role: 'client_admin', client_id: client.id, auth_user_id: authUserId,
    })
    if (puErr) {
      await supabaseAdmin.from('clients').delete().eq('id', client.id)
      await rollback()
      return NextResponse.json({ error: 'Could not link account: ' + puErr.message }, { status: 500 })
    }

    // 4. Publish the reviewed widget config.
    const cfgRow: Record<string, unknown> = {
      client_id: client.id,
      primary_color: colors?.primary || '#01A390',
      secondary_color: colors?.secondary || '#ffffff',
      text_color: colors?.text || '#111111',
      category, confidence: confidence ?? 75, position: position || 'bottom-right',
      font_family: font || 'inherit', layout: layout || 'card', hero_image: heroImage || null,
      purpose_groups: purposeGroups, translations,
      is_published: true, published_at: new Date().toISOString(), version: 1,
    }
    let { error: cfgErr } = await supabaseAdmin.from('widget_configs').insert(cfgRow)
    // Graceful fallback if the font/layout/hero migration hasn't been applied yet:
    // drop those columns and retry so onboarding never breaks on a schema lag.
    if (cfgErr && /font_family|layout|hero_image|column/i.test(cfgErr.message)) {
      const { font_family, layout: _l, hero_image, ...base } = cfgRow
      void font_family; void _l; void hero_image
      ;({ error: cfgErr } = await supabaseAdmin.from('widget_configs').insert(base))
    }
    if (cfgErr) {
      await supabaseAdmin.from('clients').delete().eq('id', client.id)
      await rollback()
      return NextResponse.json({ error: 'Could not save widget: ' + cfgErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, client_key: client.client_key })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
