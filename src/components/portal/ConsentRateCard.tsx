interface ConsentRateCardProps {
  icon: string
  label: string
  rate: number | null
  trend: number | null
  total: number | null
  totalLabel: string
  accent: 'green' | 'red'
  loading?: boolean
  error?: string | null
}

export default function ConsentRateCard({ icon, label, rate, trend, total, totalLabel, accent, loading, error }: ConsentRateCardProps) {
  const accentColor = accent === 'green' ? 'text-green-600' : 'text-red-500'
  const barColor = accent === 'green' ? 'bg-green-500' : 'bg-red-400'

  if (loading) {
    return (
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 animate-pulse">
        <div className="h-4 w-24 bg-black/[0.04] rounded mb-4" />
        <div className="h-10 w-20 bg-black/[0.04] rounded mb-2" />
        <div className="h-3 w-32 bg-black/[0.04] rounded" />
      </div>
    )
  }

  if (error || rate === null) {
    return (
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">{label}</h3>
        <p className="text-sm text-red-500">{error || 'No data available.'}</p>
      </div>
    )
  }

  const trendArrow = trend === null || trend === 0 ? null : trend > 0 ? '▲' : '▼'
  const trendColor = trend === null ? '' : trend > 0 ? (accent === 'green' ? 'text-green-600' : 'text-red-500') : trend < 0 ? (accent === 'green' ? 'text-red-500' : 'text-green-600') : ''

  return (
    <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">{icon} {label}</h3>
        {trendArrow && (
          <span className={`text-xs font-semibold ${trendColor}`}>
            {trendArrow} {Math.abs(trend!)}pp vs prev. period
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold mb-2 ${accentColor}`}>{rate}%</div>
      <div className="h-2 bg-[#e8e8ee] rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${rate}%` }} />
      </div>
      <div className="text-xs text-zinc-500">{total !== null ? total.toLocaleString() : '—'} {totalLabel}</div>
    </div>
  )
}
