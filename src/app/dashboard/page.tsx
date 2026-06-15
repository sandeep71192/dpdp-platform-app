'use client'
import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'

interface Client { id: string; name: string; domain: string; is_active: boolean; created_at: string }
interface Analytics { totals: { shown: number; accepted_all: number; rejected_all: number; customised: number; withdrawn: number }; acceptanceRate: number }

export default function DashboardOverview() {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    fetch('/api/clients').then(r => r.ok ? r.json() : { clients: [] }).then(d => setClients(d.clients || [])).catch(() => setClients([]))
    fetch('/api/analytics?days=30').then(r => r.ok ? r.json() : null).then(setAnalytics).catch(() => setAnalytics(null))
  }, [])

  const t = analytics?.totals
  const events30d = t ? t.shown + t.accepted_all + t.rejected_all + t.customised + t.withdrawn : 0
  const liveBrands = clients ? clients.filter(c => c.is_active).length : 0
  const loading = clients === null

  const stats = [
    { label: 'Total Clients', value: loading ? '—' : formatNumber(clients!.length), icon: '🏢', change: 'Onboarded brands' },
    { label: 'Consent Events', value: loading ? '—' : formatNumber(events30d), icon: '📋', change: 'Last 30 days' },
    { label: 'Acceptance Rate', value: analytics ? `${analytics.acceptanceRate}%` : '—', icon: '✅', change: 'Avg across clients' },
    { label: 'Live Brands', value: loading ? '—' : formatNumber(liveBrands), icon: '🟢', change: 'Active widgets' },
  ]

  // Most recently onboarded brands as the activity feed.
  const recent = (clients || []).slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">DPDP Act 2023 compliance dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs text-zinc-500 bg-black/[0.04] px-2 py-1 rounded-lg">30d</span>
            </div>
            <div className="text-2xl font-bold text-[#1b1b29] mb-1">{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
            <div className="text-xs text-violet-600 mt-2">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recently Onboarded</h2>
          <div className="space-y-3">
            {loading && <div className="text-sm text-zinc-500 py-3">Loading…</div>}
            {!loading && recent.length === 0 && (
              <div className="text-sm text-zinc-500 py-3">No clients yet — add your first from the Clients page.</div>
            )}
            {recent.map((c) => (
              <div key={c.id} className="flex items-center gap-4 py-3 border-b border-[#e8e8ee] last:border-0">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1b1b29] truncate">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.domain}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 border ${c.is_active ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                  {c.is_active ? 'live' : 'inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Add New Client', href: '/dashboard/clients', icon: '➕' },
              { label: 'View Analytics', href: '/dashboard/analytics', icon: '📊' },
              { label: 'Connect Shopify', href: '/dashboard/integrations', icon: '🛍️' },
              { label: 'Widget Generator', href: '/get-started', icon: '✨' },
            ].map((a) => (
              <a key={a.label} href={a.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.04] hover:bg-violet-500/10 hover:border-violet-500/20 border border-transparent text-sm text-zinc-700 hover:text-[#1b1b29] transition-all">
                <span>{a.icon}</span>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Setup banner — only when there are no clients yet */}
      {!loading && clients!.length === 0 && (
        <div className="mt-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6 flex items-center gap-6">
          <div className="text-4xl">🚀</div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#1b1b29] mb-1">Add your first client</h3>
            <p className="text-sm text-zinc-500">Onboard a brand via the widget generator, then deploy the CDN widget to go live.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="/dashboard/clients" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">Add Client →</a>
          </div>
        </div>
      )}
    </div>
  )
}
