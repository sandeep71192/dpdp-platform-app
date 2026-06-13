'use client'
import { useState } from 'react'

export interface ScoreBreakdownItem {
  id: string
  label: string
  description: string
  weight: number
  pass: boolean
  status: 'pass' | 'warn'
}

interface ComplianceScoreCardProps {
  score: number | null
  breakdown: ScoreBreakdownItem[]
  loading?: boolean
  error?: string | null
}

function scoreColor(score: number) {
  if (score >= 80) return { ring: '#22c55e', bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20', text: 'text-green-600' }
  if (score >= 50) return { ring: '#f59e0b', bg: 'from-amber-500/10 to-yellow-500/10', border: 'border-amber-500/20', text: 'text-amber-600' }
  return { ring: '#ef4444', bg: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/20', text: 'text-red-600' }
}

export default function ComplianceScoreCard({ score, breakdown, loading, error }: ComplianceScoreCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-4 w-32 bg-black/[0.04] rounded mb-3" />
        <div className="h-10 w-24 bg-black/[0.04] rounded" />
      </div>
    )
  }

  if (error || score === null) {
    return (
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Compliance Score</h2>
        <p className="text-sm text-red-500">{error || 'Unable to load compliance score.'}</p>
      </div>
    )
  }

  const colors = scoreColor(score)
  const passCount = breakdown.filter((b) => b.pass).length

  return (
    <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl p-6 mb-6`}>
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center justify-between gap-6 text-left">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8e8ee" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke={colors.ring} strokeWidth="3"
                strokeDasharray={`${(score / 100) * 97.4} 97.4`} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#1b1b29]">{score}</div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Compliance Score</h2>
            <div className="text-2xl font-bold text-[#1b1b29]">{score} / 100</div>
            <div className={`text-xs mt-1 ${colors.text}`}>{passCount} of {breakdown.length} checks passing</div>
          </div>
        </div>
        <div className="text-zinc-400 text-sm flex-shrink-0">{expanded ? '▲ Hide details' : '▼ View breakdown'}</div>
      </button>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-black/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
          {breakdown.map((item) => (
            <div key={item.id} className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
              <span className={`text-base flex-shrink-0 ${item.status === 'pass' ? 'text-green-500' : 'text-amber-500'}`}>
                {item.status === 'pass' ? '✓' : '⚠'}
              </span>
              <div>
                <div className="text-sm font-medium text-[#1b1b29]">{item.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{item.description}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{item.weight} pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
