import { NextRequest, NextResponse } from 'next/server'
import { generateWidgetJs } from '@/lib/widget-js'

export const dynamic = 'force-dynamic'

// POST /api/onboard/preview — renders the REAL widget from an unsaved draft so a
// prospect can see and interact with it before creating an account (free to preview;
// sign up only to go live). Returns a full HTML storefront with the widget mounted in
// preview mode (no consent events logged, no Consent Mode side-effects).
export async function POST(request: NextRequest) {
  try {
    const draft = await request.json()
    const origin = request.nextUrl.origin

    const rawJs = generateWidgetJs({
      clientKey: 'preview',
      brandName: draft.name || 'Your Store',
      primaryColor: draft?.colors?.primary || '#6c63ff',
      position: draft.position || 'bottom-right',
      groups: (draft.purposeGroups as never) || [],
      translations: (draft.translations as never) || {},
      apiBase: origin,
      grievanceEmail: draft.grievanceEmail || draft.email || undefined,
      preview: true,
    })
    // Inlining in <script> means any literal "</script>" in the JS (it appears in a
    // code comment) would close the tag early. Escape it so the browser executes the
    // whole script instead of dumping the rest as text.
    const js = rawJs.replace(/<\/script/gi, '<\\/script')

    const name = String(draft.name || 'Storefront').replace(/</g, '')
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;min-height:100vh;background:linear-gradient(135deg,#eceaf6,#f6f2ff);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="padding:22px">
    <div style="font-size:12px;color:#9a9ab0">${name} — live preview</div>
    <div style="margin-top:12px;height:80px;background:rgba(255,255,255,0.55);border-radius:12px"></div>
    <div style="margin-top:12px;display:flex;gap:12px">
      <div style="flex:1;height:120px;background:rgba(255,255,255,0.55);border-radius:12px"></div>
      <div style="flex:1;height:120px;background:rgba(255,255,255,0.55);border-radius:12px"></div>
    </div>
  </div>
  <script>${js}</script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Preview failed'
    return new NextResponse(`<!DOCTYPE html><body style="font-family:sans-serif;padding:20px;color:#b91c1c">Preview error: ${msg}</body>`, {
      status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
