import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'
import { LANG_NAMES } from '@/lib/lang-names'

export const dynamic = 'force-dynamic'

interface EventRow {
  event_type: string
  consented_to: Record<string, boolean> | null
  language_used: string | null
  device_type: string | null
  created_at: string
}

// GET /api/analytics?clientId=...&days=30
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId')
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10)

  // Authorization: a specific client requires ownership; the all-clients view is super-admin only.
  const ctx = await getSessionContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (clientId) {
    if (!canAccessClient(ctx, clientId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (ctx.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)

  let query = supabaseAdmin
    .from('consent_events')
    .select('event_type, consented_to, language_used, device_type, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = (data || []) as EventRow[]

  // Totals
  const totals = { shown: 0, accepted_all: 0, rejected_all: 0, customised: 0, withdrawn: 0 }
  const langCounts: Record<string, number> = {}
  const deviceCounts: Record<string, number> = {}
  const purposeAccepted: Record<string, number> = {}
  const purposeTotal: Record<string, number> = {}
  const dailyMap: Record<string, { shown: number; accepted: number; rejected: number; customised: number }> = {}

  for (const e of events) {
    if (e.event_type in totals) totals[e.event_type as keyof typeof totals]++

    // Language (count decision events, not 'shown')
    if (e.event_type !== 'shown' && e.language_used) {
      langCounts[e.language_used] = (langCounts[e.language_used] || 0) + 1
    }

    // Device
    if (e.device_type) deviceCounts[e.device_type] = (deviceCounts[e.device_type] || 0) + 1

    // Per-purpose acceptance (from decision events)
    if (e.consented_to && e.event_type !== 'shown') {
      for (const [purpose, granted] of Object.entries(e.consented_to)) {
        purposeTotal[purpose] = (purposeTotal[purpose] || 0) + 1
        if (granted) purposeAccepted[purpose] = (purposeAccepted[purpose] || 0) + 1
      }
    }

    // Daily trend
    const day = e.created_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { shown: 0, accepted: 0, rejected: 0, customised: 0 }
    if (e.event_type === 'shown') dailyMap[day].shown++
    else if (e.event_type === 'accepted_all') dailyMap[day].accepted++
    else if (e.event_type === 'rejected_all') dailyMap[day].rejected++
    else if (e.event_type === 'customised') dailyMap[day].customised++
  }

  const decisions = totals.accepted_all + totals.rejected_all + totals.customised
  const acceptanceRate = decisions ? Math.round((totals.accepted_all / decisions) * 100) : 0
  const consentRate = totals.shown ? Math.min(100, Math.round((decisions / totals.shown) * 100)) : 0

  // Language breakdown sorted
  const languages = Object.entries(langCounts)
    .map(([code, count]) => ({ code, name: LANG_NAMES[code] || code, count }))
    .sort((a, b) => b.count - a.count)

  const devices = Object.entries(deviceCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const purposes = Object.keys(purposeTotal)
    .map((p) => ({ purpose: p, accepted: purposeAccepted[p] || 0, total: purposeTotal[p], rate: Math.round(((purposeAccepted[p] || 0) / purposeTotal[p]) * 100) }))
    .sort((a, b) => b.total - a.total)

  // Fill daily gaps
  const daily: { date: string; shown: number; accepted: number; rejected: number; customised: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    daily.push({ date: key, ...(dailyMap[key] || { shown: 0, accepted: 0, rejected: 0, customised: 0 }) })
  }

  return NextResponse.json({
    totals, decisions, acceptanceRate, consentRate,
    languages, devices, purposes, daily,
    totalEvents: events.length,
  })
}
