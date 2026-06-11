import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/compliance?key=CLIENT_KEY&format=json|csv — consent records for audit
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  const format = request.nextUrl.searchParams.get('format') || 'json'
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, name, domain')
    .eq('client_key', key)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Authorization: consent records are sensitive — owner or super-admin only.
  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: events } = await supabaseAdmin
    .from('consent_events')
    .select('created_at, event_type, consented_to, language_used, device_type, country, session_id')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1000)

  const rows = events || []

  if (format === 'csv') {
    const header = 'timestamp,event_type,language,device,country,session_id,consented_purposes\n'
    const body = rows.map((r: Record<string, unknown>) => {
      const purposes = r.consented_to ? Object.entries(r.consented_to as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k).join('; ') : ''
      return [r.created_at, r.event_type, r.language_used || '', r.device_type || '', r.country || '', r.session_id || '', purposes].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    }).join('\n')
    return new NextResponse(header + body, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dpdp-consent-records-${client.domain}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json({ client, records: rows, count: rows.length })
}
