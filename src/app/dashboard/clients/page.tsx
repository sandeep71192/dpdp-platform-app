'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatDate, planColor } from '@/lib/utils'
import type { Client } from '@/types/database'
import AddClientModal from '@/components/dashboard/AddClientModal'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (data.clients) setClients(data.clients)
    } catch {
      // Supabase not connected yet — show empty state
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Clients</h1>
          <p className="text-sm text-zinc-500 mt-1">{clients.length} D2C brands connected</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20">
          ➕ Add Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text" placeholder="Search clients by name or domain…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-[#ffffff] border border-[#e8e8ee] rounded-xl px-4 py-2.5 text-sm text-[#1b1b29] placeholder-zinc-600 outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-base font-semibold text-[#1b1b29] mb-2">No clients yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Add your first D2C brand to start managing their DPDP consent widget.</p>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Add First Client
          </button>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e8ee]">
                {['Brand', 'Domain', 'Category', 'Plan', 'Widget', 'Added', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[#e8e8ee] last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1b1b29]">{c.name}</div>
                        <div className="text-xs text-zinc-500">{c.owner_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">{c.domain}</td>
                  <td className="px-5 py-4 text-sm text-zinc-500 capitalize">{((c as Client & { category?: string }).category || '').replace(/_/g, ' ')}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${planColor(c.plan)}`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                      {c.is_active ? '● Live' : '○ Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-4">
                    <a href={`/portal/${c.client_key}`} target="_blank"
                      className="text-xs text-violet-600 hover:text-violet-300 font-medium transition-colors">
                      Open Portal ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onCreated={loadClients} />}
    </div>
  )
}
