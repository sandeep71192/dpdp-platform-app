export interface LanguageAnalytics {
  code: string
  language: string
  consents: number
  percentage: number
  acceptRate: number
  rejectRate: number
}

export default function LanguageAnalyticsTable({ data }: { data: LanguageAnalytics[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Language Analytics</h2>
        <p className="text-sm text-zinc-500 py-4">No consent responses yet. Data appears once customers interact with your widget.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Language Analytics</h2>
      <div className="space-y-4">
        {data.map((l) => (
          <div key={l.code}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-700 font-medium">{l.language}</span>
              <span className="text-zinc-500">{l.consents.toLocaleString()} consents · {l.percentage}%</span>
            </div>
            <div className="h-2 bg-[#e8e8ee] rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-gradient-to-r from-[#01A390] to-[#1bbfa9] rounded-full" style={{ width: `${l.percentage}%` }} />
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-green-600">Accept {l.acceptRate}%</span>
              <span className="text-red-500">Reject {l.rejectRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
