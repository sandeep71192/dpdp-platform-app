import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'
import { resolveRange } from '@/lib/date-range'
import { fetchDecisionRows, fetchEnabledLanguages } from '@/lib/consent-aggregation'
import { languageName } from '@/lib/lang-names'

export const dynamic = 'force-dynamic'

interface LanguageTotals {
  accepted_all: number
  rejected_all: number
  customised: number
  total: number
}

// GET /api/dashboard/language-analytics?key=CLIENT_KEY&range=today|7d|30d|90d|custom&from=&to=
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const range = request.nextUrl.searchParams.get('range') || '30d'
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('client_key', key)
    .single()

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const current = resolveRange(range, from, to)

  const [rows, enabledLanguages] = await Promise.all([
    fetchDecisionRows(client.id, current.since, current.until),
    fetchEnabledLanguages(client.id),
  ])

  const langTotals: Record<string, LanguageTotals> = {}
  for (const row of rows) {
    const code = row.language_used || 'unknown'
    const t = (langTotals[code] ??= { accepted_all: 0, rejected_all: 0, customised: 0, total: 0 })
    t.total++
    if (row.event_type === 'accepted_all') t.accepted_all++
    else if (row.event_type === 'rejected_all') t.rejected_all++
    else if (row.event_type === 'customised') t.customised++
  }

  const totalDecisions = rows.length
  // Union of widget-enabled languages (so newly added ones appear with zero
  // data) and languages found in recorded consent decisions.
  const codes = new Set<string>([...enabledLanguages, ...Object.keys(langTotals)])

  const languages = Array.from(codes)
    .map((code) => {
      const t = langTotals[code] || { accepted_all: 0, rejected_all: 0, customised: 0, total: 0 }
      return {
        code,
        language: languageName(code),
        consents: t.total,
        percentage: totalDecisions ? Math.round((t.total / totalDecisions) * 100) : 0,
        acceptRate: t.total ? Math.round((t.accepted_all / t.total) * 100) : 0,
        rejectRate: t.total ? Math.round((t.rejected_all / t.total) * 100) : 0,
      }
    })
    .sort((a, b) => b.consents - a.consents)

  return NextResponse.json({ languages, totalDecisions, range })
}
