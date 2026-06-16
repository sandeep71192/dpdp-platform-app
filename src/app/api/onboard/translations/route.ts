import { NextRequest, NextResponse } from 'next/server'
import { buildStaticTranslations } from '@/lib/translations-static'

export const dynamic = 'force-dynamic'

// POST /api/onboard/translations — regenerate the static notice copy for a given brand
// name + category. Used by the review step so editing the category (or name) refreshes
// the notice copy to match. No API, instant.
export async function POST(request: NextRequest) {
  const { name, category } = await request.json()
  return NextResponse.json({ translations: buildStaticTranslations(name || 'This store', category) })
}
