import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'
import { resolveRange, previousRange } from '@/lib/date-range'
import { fetchDecisionCounts } from '@/lib/consent-aggregation'

export const dynamic = 'force-dynamic'

// GET /api/dashboard/consent-analytics?key=CLIENT_KEY&range=today|7d|30d|90d|custom&from=&to=
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
  const previous = previousRange(current)

  const [curr, prev] = await Promise.all([
    fetchDecisionCounts(client.id, current.since, current.until),
    fetchDecisionCounts(client.id, previous.since, previous.until),
  ])

  return NextResponse.json({
    acceptRate: curr.acceptRate,
    rejectRate: curr.rejectRate,
    totalAccepted: curr.accepted,
    totalRejected: curr.rejected,
    totalCustomised: curr.customised,
    totalDecisions: curr.decisions,
    acceptRateTrend: curr.acceptRate - prev.acceptRate,
    rejectRateTrend: curr.rejectRate - prev.rejectRate,
    previousAcceptRate: prev.acceptRate,
    previousRejectRate: prev.rejectRate,
    range,
  })
}
