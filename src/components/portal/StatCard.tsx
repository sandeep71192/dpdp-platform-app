import { ReactNode } from 'react'

interface StatCardProps {
  icon: string
  label: string
  value: string | number | null
  sub?: string
  loading?: boolean
  error?: string | null
  action?: ReactNode
}

// Reusable Overview stat card with built-in loading / empty / error states.
export default function StatCard({ icon, label, value, sub, loading, error, action }: StatCardProps) {
  return (
    <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        {action}
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-black/[0.04] rounded-lg animate-pulse mb-1" />
      ) : error ? (
        <div className="text-sm font-semibold text-red-500 mb-1">Error</div>
      ) : (
        <div className="text-2xl font-bold text-[#1b1b29] mb-1">{value ?? '—'}</div>
      )}
      <div className="text-xs text-zinc-500">{label}</div>
      {error ? (
        <div className="text-xs text-red-400 mt-1.5">{error}</div>
      ) : sub ? (
        <div className="text-xs text-violet-600 mt-1.5">{sub}</div>
      ) : null}
    </div>
  )
}
