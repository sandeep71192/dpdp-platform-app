// Cookie / tracker catalogue + fingerprint detection.
//
// We can't enumerate a site's runtime cookies without executing it in a headless
// browser (heavy on serverless). Instead we FINGERPRINT the brand's HTML for the
// script signatures of known platforms, then enrich each detected platform with
// its well-known cookies (name, domain, retention, purpose, privacy policy) from
// the catalogue below. The result reflects the brand's real stack, cookie-level,
// without running a browser. Runtime headless scanning is a later upgrade.

export type TrackerCategory = 'essential' | 'functional' | 'analytics' | 'marketing'

export interface Cookie {
  name: string
  domain: string // '{site}' is replaced with the brand's own domain at detection time
  expiration: string
  description: string
}

export interface TrackerPlatform {
  id: string
  platform: string // display name, e.g. "Google Analytics 4"
  provider: string // operating company, e.g. "Google"
  category: TrackerCategory
  privacyUrl: string
  signatures: string[] // lowercase substrings to look for in the page HTML
  cookies: Cookie[]
}

// A detected tracker row as shown in the widget table.
export interface DetectedTracker {
  name: string
  domain: string
  platform: string
  provider: string
  expiration: string
  description: string
  privacyUrl: string
}

const CATALOGUE: TrackerPlatform[] = [
  // ---- Essential (payments, platform, security) ----
  {
    id: 'razorpay', platform: 'Razorpay Checkout', provider: 'Razorpay', category: 'essential',
    privacyUrl: 'https://razorpay.com/privacy/',
    signatures: ['checkout.razorpay.com', 'razorpay.com', 'rzp_'],
    cookies: [
      { name: 'rzp_checkout_anon_id', domain: 'razorpay.com', expiration: 'Session', description: 'Lets you pay securely at checkout.' },
      { name: 'rzp_device_id', domain: 'razorpay.com', expiration: '1 year', description: 'Helps detect fraud on payments.' },
    ],
  },
  {
    id: 'shopify_essential', platform: 'Shopify (store & cart)', provider: 'Shopify', category: 'essential',
    privacyUrl: 'https://www.shopify.com/legal/privacy',
    signatures: ['cdn.shopify.com', 'myshopify.com', 'shopify'],
    cookies: [
      { name: 'cart', domain: '{site}', expiration: '2 weeks', description: 'Remembers the items in your cart.' },
      { name: '_secure_session_id', domain: '{site}', expiration: 'Session', description: 'Keeps your shopping session secure.' },
      { name: 'secure_customer_sig', domain: '{site}', expiration: '1 year', description: 'Keeps you securely signed in.' },
    ],
  },
  {
    id: 'cloudflare', platform: 'Cloudflare', provider: 'Cloudflare', category: 'essential',
    privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
    signatures: ['cloudflare', 'cdn-cgi', '__cf_bm'],
    cookies: [
      { name: '__cf_bm', domain: '{site}', expiration: '30 minutes', description: 'Tells humans and bots apart to keep the site safe.' },
    ],
  },

  // ---- Functional (preferences, support, reviews) ----
  {
    id: 'intercom', platform: 'Intercom', provider: 'Intercom', category: 'functional',
    privacyUrl: 'https://www.intercom.com/legal/privacy',
    signatures: ['widget.intercom.io', 'intercomcdn', 'intercom'],
    cookies: [
      { name: 'intercom-id-*', domain: '{site}', expiration: '9 months', description: 'Powers the live chat / support widget.' },
    ],
  },
  {
    id: 'freshchat', platform: 'Freshchat', provider: 'Freshworks', category: 'functional',
    privacyUrl: 'https://www.freshworks.com/privacy/',
    signatures: ['wchat.freshchat.com', 'freshchat'],
    cookies: [
      { name: '_fw_crm_v', domain: '{site}', expiration: '1 year', description: 'Powers the support chat widget.' },
    ],
  },

  // ---- Analytics ----
  {
    id: 'ga4', platform: 'Google Analytics 4', provider: 'Google', category: 'analytics',
    privacyUrl: 'https://policies.google.com/privacy',
    signatures: ['googletagmanager.com/gtag/js', 'google-analytics.com', 'gtag(', 'www.googletagmanager.com'],
    cookies: [
      { name: '_ga', domain: '{site}', expiration: '2 years', description: 'Counts you as one visitor across pages.' },
      { name: '_ga_*', domain: '{site}', expiration: '2 years', description: 'Keeps your session state for analytics.' },
      { name: '_gid', domain: '{site}', expiration: '24 hours', description: 'Tells visits apart for a day.' },
    ],
  },
  {
    id: 'shopify_analytics', platform: 'Shopify Analytics', provider: 'Shopify', category: 'analytics',
    privacyUrl: 'https://www.shopify.com/legal/privacy',
    signatures: ['shopify', 'monorail-edge.shopifysvc.com'],
    cookies: [
      { name: '_shopify_y', domain: '{site}', expiration: '1 year', description: 'Measures how you browse the store.' },
      { name: '_shopify_s', domain: '{site}', expiration: '30 minutes', description: 'Tracks your current visit.' },
    ],
  },
  {
    id: 'clarity', platform: 'Microsoft Clarity', provider: 'Microsoft', category: 'analytics',
    privacyUrl: 'https://privacy.microsoft.com/privacystatement',
    signatures: ['clarity.ms', 'www.clarity.ms'],
    cookies: [
      { name: '_clck', domain: '{site}', expiration: '1 year', description: 'Records how you use the site to improve it.' },
      { name: '_clsk', domain: '{site}', expiration: '1 day', description: 'Links your actions within one visit.' },
    ],
  },
  {
    id: 'hotjar', platform: 'Hotjar', provider: 'Hotjar', category: 'analytics',
    privacyUrl: 'https://www.hotjar.com/legal/policies/privacy/',
    signatures: ['static.hotjar.com', 'hotjar.com', 'hj('],
    cookies: [
      { name: '_hjSessionUser_*', domain: '{site}', expiration: '1 year', description: 'Remembers you across visits for usage insights.' },
      { name: '_hjSession_*', domain: '{site}', expiration: '30 minutes', description: 'Holds your current session for insights.' },
    ],
  },
  {
    id: 'mixpanel', platform: 'Mixpanel', provider: 'Mixpanel', category: 'analytics',
    privacyUrl: 'https://mixpanel.com/legal/privacy-policy/',
    signatures: ['cdn.mxpnl.com', 'mixpanel'],
    cookies: [
      { name: 'mp_*', domain: '{site}', expiration: '1 year', description: 'Measures product usage and events.' },
    ],
  },

  // ---- Marketing / Targeting ----
  {
    id: 'meta_pixel', platform: 'Meta Pixel', provider: 'Meta', category: 'marketing',
    privacyUrl: 'https://www.facebook.com/privacy/policy',
    signatures: ['connect.facebook.net', 'fbq(', 'facebook.com/tr'],
    cookies: [
      { name: '_fbp', domain: '{site}', expiration: '90 days', description: 'Used to show you our ads on Facebook & Instagram.' },
      { name: 'fr', domain: '.facebook.com', expiration: '90 days', description: 'Delivers and measures Meta ads.' },
    ],
  },
  {
    id: 'google_ads', platform: 'Google Ads', provider: 'Google', category: 'marketing',
    privacyUrl: 'https://policies.google.com/privacy',
    signatures: ['googleadservices.com', 'googlesyndication.com', 'doubleclick.net', 'gtag/js?id=aw-'],
    cookies: [
      { name: '_gcl_au', domain: '{site}', expiration: '90 days', description: 'Measures ad conversions for Google Ads.' },
      { name: 'IDE', domain: '.doubleclick.net', expiration: '13 months', description: 'Shows you relevant Google ads elsewhere.' },
    ],
  },
  {
    id: 'klaviyo', platform: 'Klaviyo', provider: 'Klaviyo', category: 'marketing',
    privacyUrl: 'https://www.klaviyo.com/legal/privacy/privacy-notice',
    signatures: ['static.klaviyo.com', 'klaviyo'],
    cookies: [
      { name: '__kla_id', domain: '{site}', expiration: '2 years', description: 'Personalises email & SMS marketing.' },
    ],
  },
  {
    id: 'webengage', platform: 'WebEngage', provider: 'WebEngage', category: 'marketing',
    privacyUrl: 'https://webengage.com/privacy-policy/',
    signatures: ['webengage', 'ssl.widgets.webengage.com'],
    cookies: [
      { name: '_we_uuid', domain: '{site}', expiration: '1 year', description: 'Personalises offers and push notifications.' },
    ],
  },
  {
    id: 'clevertap', platform: 'CleverTap', provider: 'CleverTap', category: 'marketing',
    privacyUrl: 'https://clevertap.com/privacy-policy/',
    signatures: ['clevertap', 'wzrkt.com', 'wzrk'],
    cookies: [
      { name: 'WZRK_*', domain: '{site}', expiration: '1 year', description: 'Personalises campaigns and recommendations.' },
    ],
  },
  {
    id: 'linkedin', platform: 'LinkedIn Insight', provider: 'LinkedIn', category: 'marketing',
    privacyUrl: 'https://www.linkedin.com/legal/privacy-policy',
    signatures: ['snap.licdn.com', 'px.ads.linkedin.com'],
    cookies: [
      { name: 'li_sugr', domain: '.linkedin.com', expiration: '90 days', description: 'Helps show you our LinkedIn ads.' },
    ],
  },
]

// Cookies that are always present because OUR widget sets them — disclosed as essential.
function firstPartyEssential(siteDomain: string): DetectedTracker[] {
  return [
    {
      name: 'dpdp_consent', domain: siteDomain, platform: 'Consent Manager', provider: 'This website',
      expiration: '1 year', description: 'Remembers your privacy choices so we don’t ask again every visit.',
      privacyUrl: '',
    },
  ]
}

function toRows(p: TrackerPlatform, siteDomain: string): DetectedTracker[] {
  return p.cookies.map((c) => ({
    name: c.name,
    domain: c.domain.replace('{site}', `.${siteDomain}`),
    platform: p.platform,
    provider: p.provider,
    expiration: c.expiration,
    description: c.description,
    privacyUrl: p.privacyUrl,
  }))
}

// Detect platforms in the page HTML and return their cookie rows grouped by category.
// Only categories that exist for the brand should ultimately be shown — the caller
// (attachTrackers) drops categories a brand doesn't offer (e.g. no analytics/marketing
// for a children's brand under DPDP s.9(3)).
export function detectTrackers(
  html: string,
  siteDomain: string
): Record<TrackerCategory, DetectedTracker[]> {
  const hay = (html || '').toLowerCase()
  const out: Record<TrackerCategory, DetectedTracker[]> = {
    essential: firstPartyEssential(siteDomain),
    functional: [],
    analytics: [],
    marketing: [],
  }
  const seen = new Set<string>()
  for (const p of CATALOGUE) {
    if (seen.has(p.id)) continue
    if (p.signatures.some((s) => hay.includes(s))) {
      seen.add(p.id)
      out[p.category].push(...toRows(p, siteDomain))
    }
  }
  return out
}
