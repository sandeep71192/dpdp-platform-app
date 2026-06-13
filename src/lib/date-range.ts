// Shared date-range resolution for consent analytics endpoints.
export interface DateRange {
  since: Date
  until: Date
}

// range: 'today' | '7d' | '30d' | '90d' | 'custom'
export function resolveRange(range: string, from: string | null, to: string | null): DateRange {
  const now = new Date()
  if (range === 'custom' && from) {
    return { since: new Date(from), until: to ? new Date(to) : now }
  }
  const since = new Date(now)
  switch (range) {
    case 'today':
      since.setHours(0, 0, 0, 0)
      break
    case '7d':
      since.setDate(since.getDate() - 7)
      break
    case '90d':
      since.setDate(since.getDate() - 90)
      break
    default:
      since.setDate(since.getDate() - 30)
  }
  return { since, until: now }
}

// The immediately preceding period of the same duration, for trend comparisons.
export function previousRange({ since, until }: DateRange): DateRange {
  const durationMs = until.getTime() - since.getTime()
  return { since: new Date(since.getTime() - durationMs), until: new Date(since.getTime()) }
}
