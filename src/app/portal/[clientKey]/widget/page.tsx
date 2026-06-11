'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const PLATFORMS = [
  { id: 'shopify', name: 'Shopify', icon: '🛍️', steps: ['Go to Online Store → Themes → Edit code', 'Open theme.liquid', 'Paste the script tag just before </body>', 'Save — the widget goes live instantly'] },
  { id: 'custom', name: 'Custom / HTML', icon: '💻', steps: ['Open your site\'s main HTML template', 'Paste the script tag before the closing </body> tag', 'Deploy your site'] },
  { id: 'woocommerce', name: 'WordPress', icon: '🛒', steps: ['Install a "header & footer scripts" plugin', 'Paste the script tag into the footer section', 'Save changes'] },
  { id: 'webflow', name: 'Webflow', icon: '🌊', steps: ['Project Settings → Custom Code', 'Paste the script tag in the Footer Code box', 'Save & publish your site'] },
]

export default function WidgetPage() {
  const { clientKey } = useParams<{ clientKey: string }>()
  const [config, setConfig] = useState<{ primary_color: string; category: string } | null>(null)
  const [client, setClient] = useState<{ name: string } | null>(null)
  const [activePlatform, setActivePlatform] = useState('shopify')
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetch(`/api/portal?key=${clientKey}`).then(r => r.json()).then(d => {
      if (d.client) setClient(d.client)
      if (d.config) setConfig(d.config)
    })
  }, [clientKey])

  const scriptTag = `<script src="${appUrl}/w.js?id=${clientKey}"></script>`
  const platform = PLATFORMS.find(p => p.id === activePlatform)!

  function copy() {
    navigator.clipboard.writeText(scriptTag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">My Widget</h1>
        <p className="text-sm text-zinc-500 mt-1">Install your DPDP consent widget on your store</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: install */}
        <div className="space-y-6">
          {/* Script tag */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Your Embed Code</h2>
            <div className="bg-[#f4f4f7] border border-[#e8e8ee] rounded-xl p-4 font-mono text-xs text-violet-300 break-all mb-3">
              {scriptTag}
            </div>
            <button onClick={copy}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
              {copied ? '✓ Copied!' : '📋 Copy Embed Code'}
            </button>
          </div>

          {/* Platform tabs */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Install Instructions</h2>
            <div className="flex gap-2 mb-5 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activePlatform === p.id ? 'bg-violet-600 text-white' : 'bg-black/[0.04] text-zinc-500 hover:text-[#1b1b29]'}`}>
                  <span>{p.icon}</span>{p.name}
                </button>
              ))}
            </div>
            <ol className="space-y-3">
              {platform.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Live Preview</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">● Active</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-[#e8e8ee] bg-[#f0f0f8] relative" style={{ height: 460 }}>
            {appUrl && (
              <iframe
                src={`${appUrl}/widget-preview?key=${clientKey}&name=${encodeURIComponent(client?.name || 'Store')}`}
                className="w-full h-full border-0"
                title="Widget preview"
              />
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-3 h-3 rounded-sm" style={{ background: config?.primary_color || '#6c63ff' }}></span>
            Brand color {config?.primary_color || '#6c63ff'} · Category: <span className="capitalize">{config?.category?.replace(/_/g, ' ') || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
