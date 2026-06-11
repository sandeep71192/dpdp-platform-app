import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /widget-preview?key=CLIENT_KEY — full HTML storefront preview with the widget mounted.
// Used as a stable iframe src in the client portal (avoids React srcDoc re-render races).
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') || ''
  const name = request.nextUrl.searchParams.get('name') || 'Storefront'
  const origin = request.nextUrl.origin

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;min-height:100vh;background:linear-gradient(135deg,#e8e8f8,#f4f0ff);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="padding:24px">
    <div style="font-size:13px;color:#9a9ab0">${name} storefront preview</div>
    <div style="margin-top:14px;height:90px;background:rgba(255,255,255,0.5);border-radius:12px"></div>
    <div style="margin-top:12px;display:flex;gap:12px">
      <div style="flex:1;height:120px;background:rgba(255,255,255,0.5);border-radius:12px"></div>
      <div style="flex:1;height:120px;background:rgba(255,255,255,0.5);border-radius:12px"></div>
    </div>
  </div>
  <script src="${origin}/w.js?id=${encodeURIComponent(key)}&preview=1"></script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
