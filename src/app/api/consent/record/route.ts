import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Explicit-data consent ingest — called by the form-consent widget (/f.js) when a shopper
// submits an email/phone. Stores an IDENTITY-KEYED record (current consent state per
// contactable identity per brand) that downstream marketing-tool sync reads.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

function hostOf(value: string | null): string | null {
  if (!value) return null
  try {
    const u = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return u.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}
function domainMatches(originHost: string, registered: string): boolean {
  const reg = registered.toLowerCase().replace(/^www\./, '')
  return originHost === reg || originHost.endsWith(`.${reg}`)
}

// Normalise so the same person hashes identically regardless of formatting.
function normalise(identifier: string, type: string): string {
  const v = identifier.trim().toLowerCase()
  return type === 'phone' ? v.replace(/[^\d+]/g, '') : v
}
const SALT = process.env.CONSENT_HASH_SALT || 'dpdp-consent-v1'
function hashIdentity(identifier: string, type: string): string {
  return createHash('sha256').update(normalise(identifier, type) + SALT).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_key, identifier, identifier_type, purposes, policy_version, page_url } = body

    if (!client_key || !identifier || !identifier_type) {
      return NextResponse.json({ error: 'client_key, identifier and identifier_type required' }, { status: 400, headers: CORS })
    }
    if (identifier_type !== 'email' && identifier_type !== 'phone') {
      return NextResponse.json({ error: "identifier_type must be 'email' or 'phone'" }, { status: 400, headers: CORS })
    }

    const { data: client } = await supabaseAdmin
      .from('clients').select('id, domain').eq('client_key', client_key).eq('is_active', true).single()
    if (!client) {
      return NextResponse.json({ error: 'Invalid client_key' }, { status: 404, headers: CORS })
    }

    // Same origin trust as the cookie pipeline: the event must come from the brand's domain.
    if (client.domain) {
      const originHost = hostOf(request.headers.get('origin')) ?? hostOf(request.headers.get('referer'))
      if (!originHost || !domainMatches(originHost, client.domain)) {
        return NextResponse.json({ error: 'Origin not allowed for this client_key' }, { status: 403, headers: CORS })
      }
    }

    const hash = hashIdentity(String(identifier), identifier_type)
    const row = {
      client_id: client.id,
      identifier_type,
      identifier: String(identifier).trim(),
      identifier_hash: hash,
      purposes: purposes && typeof purposes === 'object' ? purposes : {},
      policy_version: policy_version || null,
      source: 'form',
      page_url: page_url || null,
      updated_at: new Date().toISOString(),
    }
    // Upsert on (client_id, identifier_hash) so each identity has one current-state row.
    const { error } = await supabaseAdmin
      .from('consent_records')
      .upsert(row, { onConflict: 'client_id,identifier_hash' })

    if (error) {
      // Graceful while the consent_records migration hasn't been applied yet: don't break
      // the brand's form submission — log and acknowledge.
      if (/consent_records|relation|column|does not exist/i.test(error.message)) {
        return NextResponse.json({ ok: true, persisted: false }, { headers: CORS })
      }
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
    }
    return NextResponse.json({ ok: true, persisted: true }, { headers: CORS })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS })
  }
}
