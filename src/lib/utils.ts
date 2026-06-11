import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatNumber(n: number) {
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export function acceptanceRate(accepted: number, shown: number) {
  if (!shown) return 0
  return Math.round((accepted / shown) * 100)
}

export function planColor(plan: string) {
  const map: Record<string, string> = {
    free: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    growth: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return map[plan] || map.free
}

export function platformIcon(platform: string) {
  const map: Record<string, string> = {
    shopify: '🛍️', woocommerce: '🛒', webflow: '🌊',
    wix: '⚡', custom: '💻', framer: '🖼️',
  }
  return map[platform] || '🔌'
}
