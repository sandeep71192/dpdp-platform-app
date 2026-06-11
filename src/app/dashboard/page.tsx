import { formatNumber } from '@/lib/utils'

const stats = [
  { label: 'Total Clients', value: 0, icon: '🏢', change: '+0 this month' },
  { label: 'Consent Events', value: 0, icon: '📋', change: 'Last 30 days' },
  { label: 'Acceptance Rate', value: '0%', icon: '✅', change: 'Avg across clients' },
  { label: 'Active Integrations', value: 0, icon: '🔌', change: 'Shopify, Custom, etc.' },
]

const recentActivity = [
  { brand: 'Setup your first client', domain: 'Go to Clients → Add Client', time: '', status: 'pending' },
]

export default function DashboardOverview() {
  return (
    <div className="p-8">
      {/* Header */}
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
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[#e8e8ee] last:border-0">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1b1b29] truncate">{a.brand}</div>
                  <div className="text-xs text-zinc-500">{a.domain}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 flex-shrink-0">
                  {a.status}
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
              { label: 'Widget Generator', href: 'https://beautiful-starship-3c3239.netlify.app', icon: '✨', external: true },
            ].map((a) => (
              <a key={a.label} href={a.href} target={a.external ? '_blank' : undefined}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.04] hover:bg-violet-500/10 hover:border-violet-500/20 border border-transparent text-sm text-zinc-700 hover:text-[#1b1b29] transition-all">
                <span>{a.icon}</span>
                {a.label}
                {a.external && <span className="ml-auto text-zinc-600 text-xs">↗</span>}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Setup Banner */}
      <div className="mt-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6 flex items-center gap-6">
        <div className="text-4xl">🚀</div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#1b1b29] mb-1">Complete your setup</h3>
          <p className="text-sm text-zinc-500">Connect Supabase, add your first client, and deploy the CDN widget to go live.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <a href="/dashboard/clients" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Add Client →
          </a>
        </div>
      </div>
    </div>
  )
}
