import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateFormWidgetJs } from '@/lib/form-widget-js'

export const dynamic = 'force-dynamic'

// GET /f.js?id=CLIENT_KEY — serves the form-consent widget (the second, identity-keyed
// widget) for a client. Separate from /w.js so brands can adopt cookie consent and
// form consent independently.
export async function GET(request: NextRequest) {
  const clientKey = request.nextUrl.searchParams.get('id')
  const preview = request.nextUrl.searchParams.get('preview') === '1'
  const jsHeaders = {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  }

  if (!clientKey) {
    return new NextResponse('/* DPDP form widget: missing ?id= parameter */', { status: 400, headers: jsHeaders })
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, name, client_key, is_active, owner_email')
    .eq('client_key', clientKey)
    .eq('is_active', true)
    .single()

  if (!client) {
    return new NextResponse('/* DPDP form widget: invalid or inactive client key */', { status: 404, headers: jsHeaders })
  }

  // Reuse the published widget config's brand colour so both widgets match.
  const { data: config } = await supabaseAdmin
    .from('widget_configs')
    .select('primary_color')
    .eq('client_id', client.id)
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const apiBase = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const js = generateFormWidgetJs({
    clientKey: client.client_key,
    brandName: client.name,
    primaryColor: config?.primary_color || '#01A390',
    apiBase,
    grievanceEmail: client.owner_email || undefined,
    preview,
  })

  return new NextResponse(js, { status: 200, headers: jsHeaders })
}
