import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateWidgetJs } from '@/lib/widget-js'

export const dynamic = 'force-dynamic'

// GET /w.js?id=CLIENT_KEY — serves the consent widget JavaScript for a client
export async function GET(request: NextRequest) {
  const clientKey = request.nextUrl.searchParams.get('id')
  const preview = request.nextUrl.searchParams.get('preview') === '1'
  const jsHeaders = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  }

  if (!clientKey) {
    return new NextResponse('/* DPDP widget: missing ?id= parameter */', { status: 400, headers: jsHeaders })
  }

  // Fetch client + published widget config
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, name, client_key, is_active, owner_email')
    .eq('client_key', clientKey)
    .eq('is_active', true)
    .single()

  if (!client) {
    return new NextResponse('/* DPDP widget: invalid or inactive client key */', { status: 404, headers: jsHeaders })
  }

  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('*')
    .eq('client_id', client.id)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!config) {
    return new NextResponse('/* DPDP widget: no published config for this client */', { status: 404, headers: jsHeaders })
  }

  const apiBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const js = generateWidgetJs({
    clientKey: client.client_key,
    brandName: client.name,
    primaryColor: config.primary_color || '#01A390',
    position: config.position || 'bottom-right',
    font: config.font_family || 'inherit',
    layout: config.layout || 'card',
    heroImage: config.hero_image || '',
    groups: (config.purpose_groups as never) || [],
    translations: (config.translations as never) || {},
    apiBase,
    grievanceEmail: client.owner_email || undefined,
    preview,
  })

  return new NextResponse(js, { status: 200, headers: jsHeaders })
}
