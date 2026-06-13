'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import ComplianceScoreCard, { ScoreBreakdownItem } from '@/components/portal/ComplianceScoreCard'
import StatCard from '@/components/portal/StatCard'

interface Analytics {
  totals: { shown: number; accepted_all: number; rejected_all: number; customised: number }
  decisions: number
  acceptanceRate: number
  consentRate: number
  languages: { name: string; count: number }[]
  totalEvents: number
}

interface Overview {
  complianceScore: number
  scoreBreakdown: ScoreBreakdownItem[]
  totalConsentsCollected: number
  acceptanceRate: number
  activePurposes: number
  pendingRightsRequests: number
  rightsRequestsConfigured: boolean
}

type AcceptanceRange = 'today' | '7d' | '30d'

const RANGE_LABELS: Record<AcceptanceRange, string> = { today: 'Today', '7d': '7 Days', '30d': '30 Days' }

export default function PortalOverview() {
  const { clientKey } = useParams<{ clientKey: string }>()
  const [client, setClient] = useState<{ id: string; name: string; is_active: boolean } | null>(null)
  const [stats, setStats] = useState<Analytics | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [acceptanceRange, setAcceptanceRange] = useState<AcceptanceRange>('30d')

  const fetchOverview = useCallback((range: AcceptanceRange) => {
    return fetch(`/api/dashboard/overview?key=${clientKey}&range=${range}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load overview')
        return r.json()
      })
      .then((d: Overview) => { setOverview(d); setOverviewError(null) })
      .catch(() => setOverviewError('Could not load dashboard data. Try again shortly.'))
      .finally(() => setOverviewLoading(false))
  }, [clientKey])

  useEffect(() => {
    fetch(`/api/portal?key=${clientKey}`).then(r => r.json()).then(d => {
      if (d.client) {
        setClient(d.client)
        fetch(`/api/analytics?clientId=${d.client.id}&days=30`).then(r => r.json()).then(setStats).catch(() => {})
      }
    })
  }, [clientKey])

  useEffect(() => {
    fetchOverview('30d')
  }, [fetchOverview])

  function handleRangeChange(range: AcceptanceRange) {
    setAcceptanceRange(range)
    setOverviewLoading(true)
    setOverviewError(null)
    fetchOverview(range)
  }

  const base = `/portal/${clientKey}`

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Welcome back{client ? `, ${client.name}` : ''} 👋</h1>
        <p className="text-sm text-zinc-500 mt-1">Your DPDP Act 2023 consent compliance at a glance</p>
      </div>

      {/* Compliance Score */}
      <ComplianceScoreCard
        score={overview ? overview.complianceScore : null}
        breakdown={overview?.scoreBreakdown || []}
        loading={overviewLoading && !overview}
        error={overviewError}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="🗂️"
          label="Total Consents Collected"
          value={overview ? formatNumber(overview.totalConsentsCollected) : null}
          sub="All-time consent decisions"
          loading={overviewLoading && !overview}
          error={overview ? null : overviewError}
        />
        <StatCard
          icon="✅"
          label="Acceptance Rate"
          value={overview ? `${overview.acceptanceRate}%` : null}
          sub={`Accepted vs. total decisions (${RANGE_LABELS[acceptanceRange]})`}
          loading={overviewLoading && !overview}
          error={overview ? null : overviewError}
          action={
            <div className="flex gap-1">
              {(Object.keys(RANGE_LABELS) as AcceptanceRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${acceptanceRange === r ? 'bg-violet-600 text-white' : 'bg-black/[0.04] text-zinc-500 hover:text-[#1b1b29]'}`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          }
        />
        <StatCard
          icon="🎯"
          label="Active Purposes"
          value={overview ? overview.activePurposes : null}
          sub="Configured in your widget"
          loading={overviewLoading && !overview}
          error={overview ? null : overviewError}
        />
        <StatCard
          icon="📨"
          label="Rights Requests Pending"
          value={overview ? overview.pendingRightsRequests : null}
          sub={overview && !overview.rightsRequestsConfigured ? 'Workflow not yet configured' : 'Unresolved requests'}
          loading={overviewLoading && !overview}
          error={overview ? null : overviewError}
        />
      </div>

      {/* Widget status banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl flex-shrink-0">✓</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#1b1b29]">Your consent widget is live</div>
          <div className="text-xs text-zinc-500 mt-0.5">Collecting consent in compliance with India&apos;s DPDP Act 2023 across 11 languages.</div>
        </div>
        <Link href={`${base}/widget`} className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.06] border border-black/[0.08] text-[#1b1b29] text-sm font-semibold rounded-xl transition-colors flex-shrink-0">
          View Widget →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Top languages */}
        <div className="col-span-2 bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">🌐 Your Customers&apos; Languages</h2>
          {stats && stats.languages.length > 0 ? (
            <div className="space-y-3">
              {stats.languages.slice(0, 5).map(l => {
                const max = stats.languages[0].count
                return (
                  <div key={l.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-700">{l.name}</span>
                      <span className="text-zinc-500">{l.count} responses</span>
                    </div>
                    <div className="h-2 bg-[#e8e8ee] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" style={{ width: `${(l.count / max) * 100}%` }}></div>
                    </div>
                  </div>
                )
              })}
              <Link href={`${base}/analytics`} className="inline-block text-xs text-violet-600 hover:text-violet-300 mt-2">View full analytics →</Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 py-4">No consent responses yet. Data appears once customers interact with your widget.</p>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quick Links</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Install on my site', href: `${base}/widget`, icon: '📥' },
              { label: 'View analytics', href: `${base}/analytics`, icon: '📊' },
              { label: 'Compliance records', href: `${base}/compliance`, icon: '📋' },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.04] hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 text-sm text-zinc-700 hover:text-[#1b1b29] transition-all">
                <span>{a.icon}</span>{a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
