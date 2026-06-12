import { NextRequest, NextResponse } from 'next/server'
import { analyzeBrand, generateTranslations, buildPurposeGroups, attachTrackers } from '@/lib/claude'
import type { DPDPCategory } from '@/lib/dpdp-rules'

export const maxDuration = 300

// POST /api/onboard/analyze — runs Claude analysis + copy generation and returns a
// DRAFT for operator review. Does NOT persist anything (FR-1, FR-2).
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    const analysis = await analyzeBrand(url)
    const translations = await generateTranslations(analysis.brand.name, analysis.category)
    const purposeGroups = attachTrackers(
      buildPurposeGroups(analysis.category as DPDPCategory),
      analysis.detectedTrackers
    )

    return NextResponse.json({
      draft: {
        name: analysis.brand.name,
        domain: analysis.brand.domain,
        logo: analysis.brand.logo,
        tagline: analysis.brand.tagline,
        colors: analysis.brand.colors,
        category: analysis.category,
        confidence: analysis.confidence,
        description: analysis.websiteDescription,
        position: 'bottom-right',
        purposeGroups,
        translations,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analysis failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
