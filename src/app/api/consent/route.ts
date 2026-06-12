import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Consent ingest is called from arbitrary brand sites, so CORS stays open for POST.
// Integrity is enforced below by (1) validating the posting domain against the
// client's registered domain and (2) a per-client+IP rate limit.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

// --- Rate limit (in-memory token bucket, per client_key + IP) -------------
// Bounds forged/spam writes that would poison the audit log. In-memory means
// it's per-serverless-instance, which is adequate for a closed launch; move to
// a shared store (Upstash/Redis) before high-scale public traffic.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120 // ~2 events/sec per visitor source; generous for real use
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const rec = hits.get(key)
  if (!rec || now > rec.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  rec.count += 1
  return rec.count > MAX_PER_WINDOW
}

// Periodically drop stale buckets so the Map can't grow unbounded.
function sweep() {
  const now = Date.now()
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k)
}

// --- Domain validation ----------------------------------------------------
function hostOf(value: string | null): string | null {
  if (!value) return null
  try {
    // Accept bare hosts ("shop.example.com") and full URLs alike.
    const u = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return u.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

// The event is allowed if it originates from the registered domain or any of
// its subdomains (e.g. registered "example.com" permits "shop.example.com").
function domainMatches(originHost: string, registered: string): boolean {
  const reg = registered.toLowerCase().replace(/^www\./, '')
  return originHost === reg || originHost.endsWith(`.${reg}`)
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : '').trim() || 'unknown'
}

// POST /api/consent — log a consent event from the widget (called from any client site)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_key, event_type, consented_to, language_used, device_type, page_url, session_id } = body

    if (!client_key || !event_type) {
      return NextResponse.json({ error: 'client_key and event_type required' }, { status: 400, headers: CORS })
    }

    // Rate limit before any DB work.
    if (Math.random() < 0.02) sweep()
    if (rateLimited(`${client_key}:${clientIp(request)}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: CORS })
    }

    // Resolve client_key → client (also need its registered domain to validate).
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, domain')
      .eq('client_key', client_key)
      .eq('is_active', true)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Invalid client_key' }, { status: 404, headers: CORS })
    }

    // Domain validation: the event must come from the client's registered
    // domain. We trust the Origin/Referer header (set by the browser, not
    // forgeable from page JS) over the JS-supplied page_url.
    if (client.domain) {
      const originHost =
        hostOf(request.headers.get('origin')) ?? hostOf(request.headers.get('referer'))
      if (!originHost || !domainMatches(originHost, client.domain)) {
        return NextResponse.json(
          { error: 'Origin not allowed for this client_key' },
          { status: 403, headers: CORS }
        )
      }
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
