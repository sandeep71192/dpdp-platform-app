import { supabaseAdmin } from './supabase'

export const DECISION_TYPES = ['accepted_all', 'rejected_all', 'customised'] as const

export interface DecisionCounts {
  accepted: number
  rejected: number
  customised: number
  decisions: number
  acceptRate: number
  rejectRate: number
}

// Aggregation-only counts (head requests) — scales to millions of consent_events.
export async function fetchDecisionCounts(clientId: string, since: Date, until: Date): Promise<DecisionCounts> {
  const [acceptedRes, rejectedRes, customisedRes] = await Promise.all([
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'accepted_all')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'rejected_all')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
    supabaseAdmin.from('consent_events').select('*', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('event_type', 'customised')
      .gte('created_at', since.toISOString()).lte('created_at', until.toISOString()),
  ])

  const accepted = acceptedRes.count || 0
  const rejected = rejectedRes.count || 0
  const customised = customisedRes.count || 0
  const decisions = accepted + rejected + customised

  return {
    accepted,
    rejected,
    customised,
    decisions,
    acceptRate: decisions ? Math.round((accepted / decisions) * 100) : 0,
    rejectRate: decisions ? Math.round((rejected / decisions) * 100) : 0,
  }
}

export interface DecisionRow {
  event_type: string
  consented_to: Record<string, boolean> | null
  language_used: string | null
  created_at: string
}

// Row-level detail for purpose/language breakdowns, scoped to a date range.
export async function fetchDecisionRows(clientId: string, since: Date, until: Date): Promise<DecisionRow[]> {
  const { data } = await supabaseAdmin
    .from('consent_events')
    .select('event_type, consented_to, language_used, created_at')
    .eq('client_id', clientId)
    .in('event_type', DECISION_TYPES)
    .gte('created_at', since.toISOString())
    .lte('created_at', until.toISOString())
    .order('created_at', { ascending: true })

  return (data || []) as unknown as DecisionRow[]
}

export interface PurposeGroupMeta {
  id: string
  label: string
}

// Purpose groups configured in the client's published widget — drives the
// purpose set so new purposes (any vertical) show up with no code changes.
export async function fetchPurposeGroups(clientId: string): Promise<PurposeGroupMeta[]> {
  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('purpose_groups')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const groups = Array.isArray(config?.purpose_groups)
    ? (config!.purpose_groups as unknown as { id: string; label: string; enabled?: boolean }[])
    : []

  return groups.filter((g) => g.enabled !== false).map((g) => ({ id: g.id, label: g.label }))
}

// Languages enabled for the client's widget (translation bundles + default language).
export async function fetchEnabledLanguages(clientId: string): Promise<string[]> {
  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('translations, default_lang')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const translations = (config?.translations as Record<string, unknown> | null) || {}
  const codes = new Set(Object.keys(translations))
  if (config?.default_lang) codes.add(config.default_lang as string)
  return Array.from(codes)
}

export function humanizePurposeId(id: string): string {
  return id.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
