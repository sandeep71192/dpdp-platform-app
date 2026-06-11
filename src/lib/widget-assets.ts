// Shared widget visual constants — vendors, tag colors, languages

export const VENDORS_MAP: Record<string, { n: string; c: number }[]> = {
  essential: [{ n: 'Shopify', c: 4 }, { n: 'Razorpay', c: 2 }, { n: 'Cloudflare', c: 1 }],
  analytics: [{ n: 'Google Analytics', c: 4 }, { n: 'Meta Pixel', c: 2 }, { n: 'Hotjar', c: 2 }],
  marketing: [{ n: 'Klaviyo', c: 3 }, { n: 'Google Ads', c: 2 }, { n: 'Meta Ads', c: 2 }],
  functional: [{ n: 'Intercom', c: 2 }, { n: 'Google Maps', c: 1 }, { n: 'YouTube', c: 1 }],
  skin_profile: [{ n: 'Internal systems only', c: 1 }],
  dietary: [{ n: 'Internal systems only', c: 1 }],
  health_profile: [{ n: 'Internal systems only', c: 1 }],
  credit: [{ n: 'CIBIL', c: 2 }, { n: 'Experian India', c: 2 }],
  warranty: [{ n: 'Manufacturer Portal', c: 1 }, { n: 'ServiceCRM', c: 2 }],
  traveller_profile: [{ n: 'Airline GDS Systems', c: 3 }, { n: 'Hotel APIs', c: 2 }],
  home_profile: [{ n: 'Internal systems only', c: 1 }],
  pet_profile: [{ n: 'Internal systems only', c: 1 }],
  fitness_profile: [{ n: 'Internal systems only', c: 1 }],
}

export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  essential: { bg: '#dcfce7', text: '#166534' },
  analytics: { bg: '#dbeafe', text: '#1e40af' },
  marketing: { bg: '#fce7f3', text: '#9d174d' },
  functional: { bg: '#fef9c3', text: '#854d0e' },
  skin_profile: { bg: '#ffe4e6', text: '#9f1239' },
  dietary: { bg: '#ffe4e6', text: '#9f1239' },
  health_profile: { bg: '#ffe4e6', text: '#9f1239' },
  credit: { bg: '#f3e8ff', text: '#6b21a8' },
  warranty: { bg: '#e0f2fe', text: '#0369a1' },
  traveller_profile: { bg: '#fef3c7', text: '#92400e' },
  home_profile: { bg: '#f0fdf4', text: '#166534' },
  pet_profile: { bg: '#fdf4ff', text: '#86198f' },
  fitness_profile: { bg: '#fff7ed', text: '#9a3412' },
}

export const LANGUAGES: [string, string][] = [
  ['en', 'English'], ['hi', 'हिंदी'], ['bn', 'বাংলা'], ['te', 'తెలుగు'],
  ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['gu', 'ગુજરાતી'], ['kn', 'ಕನ್ನಡ'],
  ['ml', 'മലയാളം'], ['pa', 'ਪੰਜਾਬੀ'], ['or', 'ଓଡ଼ିଆ'],
]
