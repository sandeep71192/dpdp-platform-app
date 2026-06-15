// Heuristic, no-API brand analysis: classify a site into a DPDP category and extract
// brand name / colour / logo / tagline from its HTML. Less accurate than an LLM, but
// free, instant, and "good enough" because the onboarding review step lets the user
// correct any wrong guess in seconds.

import type { DPDPCategory } from './dpdp-rules'

export interface BrandFields {
  name: string
  domain: string
  colors: { primary: string; secondary: string; text: string }
  logo: string
  tagline: string
}
export interface Classification {
  brand: BrandFields
  category: DPDPCategory
  confidence: number
  websiteDescription: string
}

// Keyword signals per category (lowercase). Order matters only for tie-breaks.
const CATEGORY_KEYWORDS: Record<Exclude<DPDPCategory, 'general_ecommerce'>, string[]> = {
  fashion: ['fashion', 'apparel', 'clothing', 'tshirt', 't-shirt', 'jeans', 'dress', 'outfit', 'footwear', 'shoes', 'wardrobe', 'ethnic wear', 'menswear', 'womenswear'],
  skincare_beauty: ['skincare', 'beauty', 'cosmetic', 'makeup', 'serum', 'moisturis', 'moisturiz', 'cream', 'lipstick', 'sunscreen', 'cleanser', 'skin care'],
  food_beverage: ['grocery', 'beverage', 'snack', 'coffee', 'tea', 'chocolate', 'bakery', 'organic food', 'meal', 'spices', 'staples', 'fresh'],
  electronics: ['electronics', 'gadget', 'laptop', 'smartphone', 'mobile phone', 'headphone', 'earbuds', 'charger', 'smartwatch', 'appliance', 'speaker'],
  kids_toys: ['toy', 'toys', 'kids', 'children', 'baby', 'infant', 'nursery', 'playtime', 'diaper'],
  health_wellness: ['wellness', 'supplement', 'vitamin', 'protein', 'ayurved', 'nutrition', 'immunity', 'herbal', 'multivitamin', 'gut health'],
  finance: ['insurance', 'loan', 'credit card', 'mutual fund', 'investment', 'lending', 'emi', 'fintech', 'banking', 'premium'],
  travel: ['travel', 'hotel', 'flight', 'booking', 'holiday', 'vacation', 'tour package', 'resort', 'itinerary'],
  home_furniture: ['furniture', 'home decor', 'sofa', 'mattress', 'interior', 'decor', 'kitchenware', 'bedsheet', 'furnishing'],
  lifestyle_gifting: ['gift', 'candle', 'incense', 'fragrance', 'perfume', 'aroma', 'sustainable', 'handcrafted', 'lifestyle'],
  pets: ['pet', 'dog food', 'cat food', 'puppy', 'kitten', 'pet care', 'grooming'],
  sports_fitness: ['sport', 'fitness', 'gym', 'yoga', 'workout', 'activewear', 'running', 'athletic', 'dumbbell'],
}

// Count whole-word occurrences (so "support" doesn't match "sport", "carpet" != "pet").
function countWord(text: string, word: string): number {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (text.match(new RegExp(`\\b${esc}\\b`, 'g')) || []).length
}

// Use the site's theme-color only if it's a real brand colour — reject near-white/near-black
// (common default theme-colors) which would make the widget accent invisible.
function pickPrimaryColor(themeColor: string): string {
  const fallback = '#6c63ff'
  let hex = (themeColor || '').trim()
  if (!/^#?[0-9a-f]{3,8}$/i.test(hex)) return fallback
  hex = hex.startsWith('#') ? hex : `#${hex}`
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length < 6) return fallback
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum > 0.9 || lum < 0.06) return fallback // too light/dark to use as an accent
  return `#${h.slice(0, 6)}`
}

function meta(html: string, ...names: string[]): string {
  for (const n of names) {
    const re = new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]*content=["']([^"']+)["']`, 'i')
    const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${n}["']`, 'i'))
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function absolutise(url: string, origin: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('/')) return origin + url
  return origin + '/' + url
}

function fromDomain(domain: string): string {
  return domain.split('.')[0].replace(/^./, (c) => c.toUpperCase())
}

function cleanName(raw: string, domain: string): string {
  if (!raw) return fromDomain(domain)
  // Strip common title boilerplate: "Buy X Online", " - Home", " | tagline", emoji.
  let n = raw.split(/[|–—\-:]/)[0].trim()
  n = n.replace(/^(buy|shop|welcome to)\s+/i, '').replace(/\s+(online|india|official.*)$/i, '').trim()
  // If the title is a generic descriptive phrase rather than a brand name, prefer the domain.
  if (!n || n.length > 28 || n.split(/\s+/).length > 3 || /\b(online|shopping|store|supermarket|grocery|official)\b/i.test(n)) {
    return fromDomain(domain)
  }
  return n
}

export function classifyBrand(html: string, domain: string): Classification {
  const origin = `https://${domain}`
  const head = html.slice(0, 60000)

  // ---- Brand fields ----
  const title = (head.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim()
  const name = cleanName(meta(head, 'og:site_name', 'application-name') || title, domain)
  const tagline = (meta(head, 'description', 'og:description') || '').slice(0, 140)
  const primary = pickPrimaryColor(meta(head, 'theme-color'))
  const logoRaw =
    meta(head, 'og:image') ||
    head.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    head.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
    ''
  const logo = absolutise(logoRaw, origin)

  // ---- Category by keyword score over title + meta + visible text ----
  const text = (
    title + ' ' + tagline + ' ' +
    head.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  ).toLowerCase()

  const titleLc = title.toLowerCase()
  const scores: { cat: DPDPCategory; score: number }[] = []
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const w of words) {
      const hits = countWord(text, w)            // word-boundary, so "support" != "sport"
      if (hits) score += hits + (countWord(titleLc, w) ? 2 : 0) // title hits weigh more
    }
    scores.push({ cat: cat as DPDPCategory, score })
  }
  scores.sort((a, b) => b.score - a.score)
  const best = scores[0].score > 0 ? scores[0].cat : 'general_ecommerce'
  const bestScore = scores[0].score
  const margin = bestScore - (scores[1]?.score || 0)

  // Confidence reflects how *clear* the signal is (margin over the runner-up), not just
  // raw hits — so a wrong guess stays appropriately uncertain. Capped at 85 (heuristic).
  const confidence = bestScore === 0 ? 55 : Math.max(55, Math.min(85, 58 + bestScore * 2 + margin * 4))

  return {
    brand: { name, domain, colors: { primary, secondary: '#ffffff', text: '#111111' }, logo, tagline },
    category: best,
    confidence,
    websiteDescription: tagline || `Indian ${best.replace(/_/g, ' ')} brand`,
  }
}
