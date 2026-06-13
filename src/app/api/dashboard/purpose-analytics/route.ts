import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'
import { resolveRange } from '@/lib/date-range'
import { fetchDecisionRows, fetchPurposeGroups, humanizePurposeId } from '@/lib/consent-aggregation'

export const dynamic = 'force-dynamic'

interface PurposeTotals {
  accepted: number
  rejected: number
  total: number
}

// GET /api/dashboard/purpose-analytics?key=CLIENT_KEY&range=today|7d|30d|90d|custom&from=&to=
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
  const trend = resolveRange('30d', null, null)

  const [rows, trendRows, purposeGroups] = await Promise.all([
    fetchDecisionRows(client.id, current.since, current.until),
    fetchDecisionRows(client.id, trend.since, trend.until),
    fetchPurposeGroups(client.id),
  ])

  // Current-period totals per purpose, keyed by the purpose id from consented_to.
  const purposeTotals: Record<string, PurposeTotals> = {}
  for (const row of rows) {
    if (!row.consented_to) continue
    for (const [purpose, granted] of Object.entries(row.consented_to)) {
      const t = (purposeTotals[purpose] ??= { accepted: 0, rejected: 0, total: 0 })
      t.total++
      if (granted) t.accepted++
      else t.rejected++
    }
  }

  // Fixed 30-day daily trend per purpose, independent of the selected range.
  const dailyMap: Record<string, Record<string, { accepted: number; rejected: number }>> = {}
  for (const row of trendRows) {
    if (!row.consented_to) continue
    const day = row.created_at.slice(0, 10)
    for (const [purpose, granted] of Object.entries(row.consented_to)) {
      const byDay = (dailyMap[purpose] ??= {})
      const d = (byDay[day] ??= { accepted: 0, rejected: 0 })
      if (granted) d.accepted++
      else d.rejected++
    }
  }

  function buildTrend(purpose: string) {
    const days: { date: string; accepted: number; rejected: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const entry = dailyMap[purpose]?.[key] || { accepted: 0, rejected: 0 }
      days.push({ date: key, ...entry })
    }
    return days
  }

  const labelMap = new Map(purposeGroups.map((g) => [g.id, g.label]))
  // Union of configured purposes (so newly added ones appear with zero data)
  // and purposes found in recorded consent decisions (covers historical data
  // for purposes no longer in the active config).
  const purposeIds = new Set<string>([...purposeGroups.map((g) => g.id), ...Object.keys(purposeTotals)])

  const purposes = Array.from(purposeIds)
    .map((id) => {
      const t = purposeTotals[id] || { accepted: 0, rejected: 0, total: 0 }
      return {
        purpose: id,
        label: labelMap.get(id) || humanizePurposeId(id),
        acceptRate: t.total ? Math.round((t.accepted / t.total) * 100) : 0,
        accepted: t.accepted,
        rejected: t.rejected,
        total: t.total,
        trend: buildTrend(id),
      }
    })
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ purposes, range })
}
