'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatNumber } from '@/lib/utils'
import type { Client } from '@/types/database'

interface AnalyticsData {
  totals: { shown: number; accepted_all: number; rejected_all: number; customised: number; withdrawn: number }
  decisions: number
  acceptanceRate: number
  consentRate: number
  languages: { code: string; name: string; count: number }[]
  devices: { type: string; count: number }[]
  purposes: { purpose: string; accepted: number; total: number; rate: number }[]
  daily: { date: string; shown: number; accepted: number; rejected: number; customised: number }[]
  totalEvents: number
}

const DEVICE_ICON: Record<string, string> = { mobile: '📱', desktop: '💻', tablet: '📲' }

export default function AnalyticsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState<string>('')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { if (d.clients) setClients(d.clients) }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (clientId) params.set('clientId', clientId)
      const res = await fetch(`/api/analytics?${params}`)
      setData(await res.json())
    } catch { /* no data */ }
    setLoading(false)
  }, [clientId, days])

  useEffect(() => { load() }, [load])

  const maxDaily = data ? Math.max(1, ...data.daily.map(d => d.shown)) : 1

  return (
    <div className="p-8">
      {/* Header + filters */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Consent events {clientId ? 'for selected client' : 'across all clients'}</p>
        </div>
        <div className="flex gap-3">
          <select value={clientId} onChange={e => setClientId(e.target.value)}
            className="bg-[#ffffff] border border-[#e8e8ee] rounded-xl px-4 py-2.5 text-sm text-[#1b1b29] outline-none focus:border-[#01A390]">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex bg-[#ffffff] border border-[#e8e8ee] rounded-xl p-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${days === d ? 'bg-[#01A390] text-white' : 'text-zinc-500 hover:text-[#1b1b29]'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-2 border-[#01A390]/30 border-t-[#01A390] rounded-full animate-spin"></div>
        </div>
      ) : !data || data.totalEvents === 0 ? (
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-base font-semibold text-[#1b1b29] mb-2">No consent events yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">Once your widget is live and visitors interact with it, real-time analytics will appear here.</p>
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Widget Shown', value: formatNumber(data.totals.shown), icon: '👁️', sub: `${data.totalEvents} total events` },
              { label: 'Consent Rate', value: `${data.consentRate}%`, icon: '🤝', sub: `${data.decisions} decisions made` },
              { label: 'Acceptance Rate', value: `${data.acceptanceRate}%`, icon: '✅', sub: `${data.totals.accepted_all} accepted all` },
              { label: 'Rejection Rate', value: `${data.decisions ? Math.round((data.totals.rejected_all / data.decisions) * 100) : 0}%`, icon: '🛑', sub: `${data.totals.rejected_all} rejected` },
            ].map(s => (
              <div key={s.label} className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-5">
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-2xl font-bold text-[#1b1b29] mb-1">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
                <div className="text-xs text-[#01A390] mt-1.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Daily trend chart */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Daily Activity</h2>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-400"></span>Shown</span>
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span>Accepted</span>
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>Rejected</span>
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-sm bg-[#01A390]"></span>Customised</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-40">
              {data.daily.map((d, i) => {
                const total = d.shown || 0
                const h = (total / maxDaily) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                    <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${Math.max(h, 2)}%` }}>
                      {d.shown > 0 ? (
                        <>
                          <div className="bg-green-500" style={{ height: `${(d.accepted / total) * 100}%` }}></div>
                          <div className="bg-red-500" style={{ height: `${(d.rejected / total) * 100}%` }}></div>
                          <div className="bg-[#01A390]" style={{ height: `${(d.customised / total) * 100}%` }}></div>
                          <div className="bg-zinc-300 flex-1"></div>
                        </>
                      ) : <div className="bg-zinc-200 h-full"></div>}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white whitespace-nowrap z-10">
                      <div className="font-semibold mb-0.5">{d.date.slice(5)}</div>
                      <div className="text-zinc-500">Shown: {d.shown}</div>
                      <div className="text-green-400">Accepted: {d.accepted}</div>
                      <div className="text-red-400">Rejected: {d.rejected}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Language breakdown */}
            <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">🌐 Languages</h2>
              {data.languages.length === 0 ? <p className="text-xs text-zinc-600">No data</p> : (
                <div className="space-y-3">
                  {data.languages.slice(0, 6).map(l => {
                    const max = data.languages[0].count
                    return (
                      <div key={l.code}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-700">{l.name}</span>
                          <span className="text-zinc-500">{l.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#e8e8ee] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#01A390] to-[#1bbfa9] rounded-full" style={{ width: `${(l.count / max) * 100}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Device breakdown */}
            <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">📱 Devices</h2>
              {data.devices.length === 0 ? <p className="text-xs text-zinc-600">No data</p> : (
                <div className="space-y-4">
                  {data.devices.map(d => {
                    const totalDev = data.devices.reduce((s, x) => s + x.count, 0)
                    const pct = Math.round((d.count / totalDev) * 100)
                    return (
                      <div key={d.type} className="flex items-center gap-3">
                        <span className="text-xl">{DEVICE_ICON[d.type] || '🖥️'}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-700 capitalize">{d.type}</span>
                            <span className="text-zinc-500">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#e8e8ee] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Purpose acceptance */}
            <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">🎯 Purpose Opt-in</h2>
              {data.purposes.length === 0 ? <p className="text-xs text-zinc-600">No data</p> : (
                <div className="space-y-3">
                  {data.purposes.map(p => (
                    <div key={p.purpose}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-700 capitalize">{p.purpose.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-500">{p.rate}%</span>
                      </div>
                      <div className="h-1.5 bg-[#e8e8ee] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.rate >= 70 ? 'bg-green-500' : p.rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.rate}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
