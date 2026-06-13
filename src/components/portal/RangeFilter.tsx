export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom'

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  custom: 'Custom',
}

interface RangeFilterProps {
  range: RangeKey
  from: string
  to: string
  onChange: (range: RangeKey, from?: string, to?: string) => void
}

export default function RangeFilter({ range, from, to, onChange }: RangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${range === key ? 'bg-violet-600 text-white' : 'bg-black/[0.04] text-zinc-500 hover:text-[#1b1b29]'}`}
        >
          {RANGE_LABELS[key]}
        </button>
      ))}
      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => onChange('custom', e.target.value, to)}
            className="text-xs px-2 py-1.5 rounded-lg border border-[#e8e8ee] bg-white text-zinc-700"
          />
          <span className="text-zinc-400 text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange('custom', from, e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-[#e8e8ee] bg-white text-zinc-700"
          />
        </div>
      )}
    </div>
  )
}
