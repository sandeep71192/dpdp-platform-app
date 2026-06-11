import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

// POST /api/consent — log a consent event from the widget (called from any client site)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_key, event_type, consented_to, language_used, device_type, page_url, session_id } = body

    if (!client_key || !event_type) {
      return NextResponse.json({ error: 'client_key and event_type required' }, { status: 400, headers: CORS })
    }

    // Resolve client_key → client_id
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('client_key', client_key)
      .eq('is_active', true)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Invalid client_key' }, { status: 404, headers: CORS })
    }

    const { error } = await supabaseAdmin.from('consent_events').insert({
      client_id: client.id,
      event_type,
      consented_to: consented_to || {},
      language_used: language_used || null,
      device_type: device_type || null,
      country: 'IN',
      page_url: page_url || null,
      session_id: session_id || null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
    return NextResponse.json({ ok: true }, { headers: CORS })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS })
  }
}
