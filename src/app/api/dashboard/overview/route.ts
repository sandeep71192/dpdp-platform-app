import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionContext, canAccessClient } from '@/lib/auth'
import { computeComplianceScore } from '@/lib/compliance-score'

export const dynamic = 'force-dynamic'

const DECISION_TYPES = ['accepted_all', 'rejected_all', 'customised']

function rangeToDates(range: string, from: string | null, to: string | null) {
  const now = new Date()
  if (range === 'custom' && from) {
    return { since: new Date(from), until: to ? new Date(to) : now }
  }
  const since = new Date(now)
  if (range === 'today') {
    since.setHours(0, 0, 0, 0)
  } else if (range === '7d') {
    since.setDate(since.getDate() - 7)
  } else {
    since.setDate(since.getDate() - 30)
  }
  return { since, until: now }
}

interface PurposeGroupConfig {
  id: string
  label: string
  enabled?: boolean
}

// GET /api/dashboard/overview?key=CLIENT_KEY&range=today|7d|30d|custom&from=&to=
// Powers the customer Overview dashboard: compliance score + quick stats,
// computed live from consent_events, widget_configs and integrations.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const range = request.nextUrl.searchParams.get('range') || '30d'
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, is_active')
    .eq('client_key', key)
    .single()

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const ctx = await getSessionContext()
  if (!canAccessClient(ctx, client.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const clientId = client.id
  const { since, until } = rangeToDates(range, from, to)

  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('purpose_groups, show_language_switcher, is_published')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  // Aggregation-only queries (count via head requests) so this scales from a
  // handful of visitors to millions of consent_events without loading rows.
  const [
    totalRes,
    acceptedRes,
    rejectedRes,
    customisedRes,
    withdrawnRes,
    integrationsRes,
  ] = await Promise.all([
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).in('event_type', DECISION_TYPES),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'accepted_all')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'rejected_all')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'customised')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'withdrawn'),
    supabaseAdmin.from('integrations').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('status', 'connected'),
  ])

  const totalConsentsCollected = totalRes.count || 0
  const accepted = acceptedRes.count || 0
  const rejected = rejectedRes.count || 0
  const customised = customisedRes.count || 0
  const withdrawn = withdrawnRes.count || 0
  const connectedIntegrations = integrationsRes.count || 0

  const decisions = accepted + rejected + customised
  const acceptanceRate = decisions ? Math.round((accepted / decisions) * 100) : 0

  const purposeGroups = Array.isArray(config?.purpose_groups)
    ? (config!.purpose_groups as unknown as PurposeGroupConfig[])
    : []
  const activeGroups = purposeGroups.filter((g) => g.enabled !== false)

  const { score, breakdown } = computeComplianceScore({
    widgetPublished: !!config?.is_published,
    hasConsentRecords: totalConsentsCollected > 0,
    purposeGroupsConfigured: purposeGroups.length > 0,
    multiLanguageEnabled: !!config?.show_language_switcher,
    withdrawalAvailable: withdrawn > 0,
    vendorRegistryConfigured: connectedIntegrations > 0,
    rightsRequestWorkflowEnabled: false,
    cookieScanCompleted: false,
  })

  return NextResponse.json({
    client: { id: client.id, name: client.name, is_active: client.is_active },
    complianceScore: score,
    scoreBreakdown: breakdown,
    totalConsentsCollected,
    acceptanceRate,
    acceptanceDecisions: decisions,
    activePurposes: activeGroups.length,
    activePurposeNames: activeGroups.map((g) => g.label),
    pendingRightsRequests: 0,
    rightsRequestsConfigured: false,
    range,
  })
}
