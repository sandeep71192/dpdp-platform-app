'use client'
import { useState } from 'react'

export interface PurposeAnalytics {
  purpose: string
  label: string
  acceptRate: number
  accepted: number
  rejected: number
  total: number
  trend: { date: string; accepted: number; rejected: number }[]
}

export default function PurposeCard({ data }: { data: PurposeAnalytics }) {
  const [open, setOpen] = useState(false)
  const maxTrend = Math.max(1, ...data.trend.map((d) => d.accepted + d.rejected))

  return (
    <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1b1b29]">{data.label}</span>
          <span className="text-xs text-zinc-400">{open ? '▲' : '▼'}</span>
        </div>
        <div className="text-3xl font-bold text-violet-600 mb-1">{data.acceptRate}%</div>
        <div className="h-1.5 bg-[#e8e8ee] rounded-full overflow-hidden mb-1">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${data.acceptRate}%` }} />
        </div>
        <div className="text-xs text-zinc-500">{data.total.toLocaleString()} decisions</div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-[#e8e8ee] space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{data.accepted.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">Accepted</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-500">{data.rejected.toLocaleString()}</div>
              <div className="text-xs text-zinc-500">Rejected</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#1b1b29]">{data.acceptRate}%</div>
              <div className="text-xs text-zinc-500">Acceptance</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1.5">Last 30 days</div>
            <div className="flex items-end gap-[2px] h-12">
              {data.trend.map((d) => {
                const acceptedH = (d.accepted / maxTrend) * 100
                const rejectedH = (d.rejected / maxTrend) * 100
                return (
                  <div
                    key={d.date}
                    className="flex-1 h-full flex flex-col-reverse"
                    title={`${d.date}: ${d.accepted} accepted, ${d.rejected} rejected`}
                  >
                    <div className="w-full bg-violet-500 rounded-t-[1px]" style={{ height: `${acceptedH}%` }} />
                    <div className="w-full bg-red-300" style={{ height: `${rejectedH}%` }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
