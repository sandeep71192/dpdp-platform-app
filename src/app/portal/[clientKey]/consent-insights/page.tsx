'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import RangeFilter, { RangeKey } from '@/components/portal/RangeFilter'
import ConsentRateCard from '@/components/portal/ConsentRateCard'
import PurposeCard, { PurposeAnalytics } from '@/components/portal/PurposeCard'
import LanguageAnalyticsTable, { LanguageAnalytics } from '@/components/portal/LanguageAnalyticsTable'

interface ConsentAnalytics {
  acceptRate: number
  rejectRate: number
  totalAccepted: number
  totalRejected: number
  totalDecisions: number
  acceptRateTrend: number
  rejectRateTrend: number
}

export default function ConsentInsightsPage() {
  const { clientKey } = useParams<{ clientKey: string }>()
  const [range, setRange] = useState<RangeKey>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [consent, setConsent] = useState<ConsentAnalytics | null>(null)
  const [purposes, setPurposes] = useState<PurposeAnalytics[] | null>(null)
  const [languages, setLanguages] = useState<LanguageAnalytics[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((r: RangeKey, f: string, t: string) => {
    const params = new URLSearchParams({ key: String(clientKey), range: r })
    if (r === 'custom') {
      if (f) params.set('from', f)
      if (t) params.set('to', t)
    }
    const qs = params.toString()

    return Promise.all([
      fetch(`/api/dashboard/consent-analytics?${qs}`).then((res) => res.json()),
      fetch(`/api/dashboard/purpose-analytics?${qs}`).then((res) => res.json()),
      fetch(`/api/dashboard/language-analytics?${qs}`).then((res) => res.json()),
    ])
      .then(([c, p, l]) => {
        if (c.error || p.error || l.error) throw new Error('Failed to load')
        setConsent(c)
        setPurposes(p.purposes)
        setLanguages(l.languages)
        setError(null)
      })
      .catch(() => setError('Could not load consent insights. Try again shortly.'))
      .finally(() => setLoading(false))
  }, [clientKey])

  useEffect(() => {
    load('30d', '', '')
  }, [load])

  function handleRangeChange(r: RangeKey, f?: string, t?: string) {
    const nextFrom = f ?? from
    const nextTo = t ?? to
    setRange(r)
    if (f !== undefined) setFrom(f)
    if (t !== undefined) setTo(t)
    if (r === 'custom' && !nextFrom) return
    setLoading(true)
    setError(null)
    load(r, nextFrom, nextTo)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Consent Insights</h1>
          <p className="text-sm text-zinc-500 mt-1">How visitors respond to your consent widget, by purpose and language</p>
        </div>
        <RangeFilter range={range} from={from} to={to} onChange={handleRangeChange} />
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-6 text-sm text-red-500">{error}</div>
      )}

      {/* Section 1: Consent Analytics */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Consent Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ConsentRateCard
            icon="✅"
            label="Accept Rate"
            rate={consent ? consent.acceptRate : null}
            trend={consent ? consent.acceptRateTrend : null}
            total={consent ? consent.totalAccepted : null}
            totalLabel="accepted consents"
            accent="green"
            loading={loading && !consent}
            error={consent ? null : error}
          />
          <ConsentRateCard
            icon="🚫"
            label="Reject Rate"
            rate={consent ? consent.rejectRate : null}
            trend={consent ? consent.rejectRateTrend : null}
            total={consent ? consent.totalRejected : null}
            totalLabel="rejected consents"
            accent="red"
            loading={loading && !consent}
            error={consent ? null : error}
          />
        </div>
      </div>

      {/* Section 2: Purpose Analytics */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Purpose Analytics</h2>
        {loading && !purposes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-20 bg-black/[0.04] rounded mb-3" />
                <div className="h-8 w-14 bg-black/[0.04] rounded mb-2" />
                <div className="h-1.5 w-full bg-black/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        ) : !purposes || purposes.length === 0 ? (
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
            <p className="text-sm text-zinc-500">No purposes configured yet. Add purpose categories in your widget configuration to see analytics here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {purposes.map((p) => (
              <PurposeCard key={p.purpose} data={p} />
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Language Analytics */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Language Analytics</h2>
        {loading && !languages ? (
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 animate-pulse space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="h-3 w-32 bg-black/[0.04] rounded mb-2" />
                <div className="h-2 w-full bg-black/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <LanguageAnalyticsTable data={languages || []} />
        )}
      </div>
    </div>
  )
}
