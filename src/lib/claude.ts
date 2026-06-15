// No-API brand analysis + widget copy.
//
// The generator used to call the Anthropic API for (1) brand classification and
// (2) 11-language copy. Both are now deterministic and free:
//   - classification + brand extraction → heuristics (classify.ts)
//   - translations → static pre-translated dictionaries (translations-static.ts)
// This removes the API as a hard dependency, so the generator never breaks on billing,
// is instant, and avoids AI-mistranslation liability. The onboarding review step lets
// the user correct any wrong guess before publishing.

import { getRulesForCategory, type DPDPCategory } from './dpdp-rules'
import { detectTrackers, type DetectedTracker, type TrackerCategory } from './trackers'
import { classifyBrand } from './classify'
import { buildStaticTranslations, type Translations } from './translations-static'

export type { Translations }

export interface BrandAnalysis {
  brand: {
    name: string
    domain: string
    colors: { primary: string; secondary: string; text: string }
    logo: string
    tagline: string
  }
  category: DPDPCategory
  confidence: number
  websiteDescription: string
  detectedTrackers: Record<TrackerCategory, DetectedTracker[]>
}

async function fetchWebsiteHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DPDPBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    return await res.text()
  } catch {
    // Fallback to CORS proxy
    try {
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) })
      const data = await res.json()
      return data.contents || ''
    } catch {
      return ''
    }
  }
}

export async function analyzeBrand(url: string): Promise<BrandAnalysis> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
  const domain = new URL(normalizedUrl).hostname.replace('www.', '')

  const html = await fetchWebsiteHtml(normalizedUrl)

  // Heuristic classification + brand extraction (no API).
  const c = classifyBrand(html, domain)
  // Fingerprint the brand's actual tracking stack from the raw HTML.
  const detectedTrackers = detectTrackers(html, domain)

  return {
    brand: c.brand,
    category: c.category,
    confidence: c.confidence,
    websiteDescription: c.websiteDescription,
    detectedTrackers,
  }
}

// Static, pre-translated widget copy (no API).
export function generateTranslations(brandName: string, _category?: string): Translations {
  return buildStaticTranslations(brandName)
}

export function buildPurposeGroups(category: DPDPCategory) {
  const rules = getRulesForCategory(category)
  return rules.purposeGroups.map((g) => ({
    id: g.id,
    label: g.label,
    description: g.description,
    necessary: g.necessary,
    enabled: true,
    dataPoints: g.dataPoints,
    trackers: [] as DetectedTracker[],
  }))
}

// Attach detected cookies/trackers to the matching purpose group. Trackers are only
// attached to groups that exist for this brand, so categories a brand doesn't offer
// (e.g. analytics/marketing on a children's site, removed under DPDP s.9(3)) silently
// drop their detected trackers instead of resurrecting a prohibited purpose.
export function attachTrackers(
  groups: ReturnType<typeof buildPurposeGroups>,
  detected: Record<TrackerCategory, DetectedTracker[]>
) {
  const keys: TrackerCategory[] = ['essential', 'functional', 'analytics', 'marketing']
  return groups.map((g) =>
    (keys as string[]).includes(g.id)
      ? { ...g, trackers: detected[g.id as TrackerCategory] || [] }
      : g
  )
}
