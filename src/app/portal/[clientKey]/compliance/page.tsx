'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Record_ {
  created_at: string
  event_type: string
  consented_to: Record<string, boolean> | null
  language_used: string | null
  device_type: string | null
  country: string
  session_id: string | null
}

const EVENT_BADGE: Record<string, string> = {
  shown: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  accepted_all: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected_all: 'bg-red-500/10 text-red-400 border-red-500/20',
  customised: 'bg-[#01A390]/10 text-[#01A390] border-[#01A390]/20',
  withdrawn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default function CompliancePage() {
  const { clientKey } = useParams<{ clientKey: string }>()
  const [records, setRecords] = useState<Record_[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/compliance?key=${clientKey}`).then(r => r.json()).then(d => {
      if (d.records) { setRecords(d.records); setCount(d.count) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [clientKey])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Compliance Records</h1>
          <p className="text-sm text-zinc-500 mt-1">Auditable consent log under DPDP Act 2023 · {count} records</p>
        </div>
        <a href={`/api/compliance?key=${clientKey}&format=csv`} download
          className="px-4 py-2.5 bg-[#01A390] hover:bg-[#01A390] text-white text-sm font-semibold rounded-xl transition-colors">
          ⬇️ Export CSV
        </a>
      </div>

      {/* DPDP compliance notice */}
      <div className="bg-gradient-to-r from-[#01A390]/10 to-blue-500/10 border border-[#01A390]/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <div className="text-2xl">🇮🇳</div>
        <div className="text-xs text-zinc-700 leading-relaxed">
          <strong className="text-[#1b1b29]">DPDP Act 2023 audit trail.</strong> Every consent interaction is logged with a timestamp, the purposes consented to, language, and an anonymised session ID — <span className="text-zinc-500">no personally identifiable information is stored</span>. Export this log for Data Protection Board audits or grievance handling.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-[#01A390]/30 border-t-[#01A390] rounded-full animate-spin"></div></div>
      ) : records.length === 0 ? (
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-base font-semibold text-[#1b1b29] mb-2">No records yet</h3>
          <p className="text-sm text-zinc-500">Consent records will appear here as customers interact with your widget.</p>
        </div>
      ) : (
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e8ee]">
                {['Timestamp', 'Event', 'Purposes Consented', 'Language', 'Device', 'Session'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 100).map((r, i) => {
                const purposes = r.consented_to ? Object.entries(r.consented_to).filter(([, v]) => v).map(([k]) => k) : []
                return (
                  <tr key={i} className="border-b border-[#e8e8ee] last:border-0 hover:bg-black/[0.02]">
                    <td className="px-5 py-3 text-xs text-zinc-500 font-mono whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${EVENT_BADGE[r.event_type] || EVENT_BADGE.shown}`}>{r.event_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {purposes.length ? purposes.map(p => (
                          <span key={p} className="text-[10px] bg-black/[0.04] text-zinc-500 px-1.5 py-0.5 rounded capitalize">{p.replace(/_/g, ' ')}</span>
                        )) : <span className="text-xs text-zinc-600">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-500 uppercase">{r.language_used || '—'}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500 capitalize">{r.device_type || '—'}</td>
                    <td className="px-5 py-3 text-xs text-zinc-600 font-mono">{r.session_id ? r.session_id.slice(0, 8) + '…' : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {records.length > 100 && (
            <div className="px-5 py-3 text-xs text-zinc-500 border-t border-[#e8e8ee]">Showing latest 100 of {count} — export CSV for the full log.</div>
          )}
        </div>
      )}
    </div>
  )
}
