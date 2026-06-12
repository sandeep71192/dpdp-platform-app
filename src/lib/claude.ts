import Anthropic from '@anthropic-ai/sdk'
import { getRulesForCategory, type DPDPCategory } from './dpdp-rules'
import { LANGUAGES } from './widget-assets'
import { detectTrackers, type DetectedTracker, type TrackerCategory } from './trackers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = [
  'fashion', 'skincare_beauty', 'food_beverage', 'electronics', 'kids_toys',
  'health_wellness', 'finance', 'general_ecommerce', 'travel', 'home_furniture',
  'lifestyle_gifting', 'pets', 'sports_fitness',
]

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

function extractText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : ''
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean) as T
  } catch {
    return fallback
  }
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
  const snippet = html
    .slice(0, 12000)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `You are a brand analyst for Indian D2C websites. Analyze this website and return ONLY valid JSON.

URL: ${normalizedUrl}
Domain: ${domain}
Page content: ${snippet}

Classify into ONE of: ${CATEGORIES.join(', ')}

Return ONLY this JSON (no markdown):
{
  "brand": {
    "name": "Brand display name",
    "domain": "${domain}",
    "colors": { "primary": "#hex (dominant brand color)", "secondary": "#hex", "text": "#111111" },
    "logo": "absolute logo URL if found else empty string",
    "tagline": "brand tagline or short description"
  },
  "category": "one_of_the_13_categories",
  "confidence": 85,
  "websiteDescription": "1-2 sentence description of what this brand sells"
}`,
    }],
  })

  const fallback: BrandAnalysis = {
    brand: {
      name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      domain,
      colors: { primary: '#6c63ff', secondary: '#ffffff', text: '#111111' },
      logo: '',
      tagline: '',
    },
    category: 'general_ecommerce',
    confidence: 50,
    websiteDescription: 'Indian e-commerce website',
    detectedTrackers: { essential: [], functional: [], analytics: [], marketing: [] },
  }

  // Fingerprint the brand's actual tracking stack from the raw HTML (scripts intact).
  const detectedTrackers = detectTrackers(html, domain)
  const parsed = parseJson(extractText(message), fallback)
  return { ...parsed, detectedTrackers }
}

export interface Translations {
  [lang: string]: {
    title: string
    body: string
    allowAll: string
    onlyNecessary: string
    customise: string
    poweredBy: string
  }
}

export async function generateTranslations(brandName: string, category: string): Promise<Translations> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Generate DPDP Act 2023 consent widget copy for ${brandName}, an Indian ${category} brand.

Return ONLY valid JSON (no markdown) with these exact language keys: en, hi, bn, te, mr, ta, gu, kn, ml, pa, or.
Languages: ${LANGUAGES.map(([c, n]) => `${c}=${n}`).join(', ')}.

Each language object needs: title, body (1-2 warm sentences about data privacy, under 25 words, native script), allowAll, onlyNecessary, customise, poweredBy.

Structure:
{ "en": { "title": "...", "body": "...", "allowAll": "...", "onlyNecessary": "...", "customise": "...", "poweredBy": "..." }, "hi": {...}, ... }`,
    }],
  })

  const fallback: Translations = {
    en: { title: 'We value your privacy', body: `We use data to improve your experience on ${brandName}, per India's DPDP Act 2023.`, allowAll: 'Accept All', onlyNecessary: 'Only Necessary', customise: 'Customise', poweredBy: 'Protected under DPDP Act 2023' },
  }

  return parseJson(extractText(message), fallback)
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
