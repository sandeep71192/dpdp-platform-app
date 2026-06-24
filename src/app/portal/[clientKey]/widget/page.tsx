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
  const [client, setClient] = useState<{ name: string; domain: string } | null>(null)
  const [activePlatform, setActivePlatform] = useState('shopify')
  const [copied, setCopied] = useState(false)
  const [appUrl, setAppUrl] = useState('')
  const [lastEventAt, setLastEventAt] = useState<string | null | undefined>(undefined)
  const [domainInput, setDomainInput] = useState('')
  const [domainSaving, setDomainSaving] = useState(false)
  const [domainSaved, setDomainSaved] = useState(false)
  const [domainError, setDomainError] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetch(`/api/portal?key=${clientKey}`).then(r => r.json()).then(d => {
      if (d.client) { setClient(d.client); setDomainInput(d.client.domain || '') }
      if (d.config) setConfig(d.config)
      setLastEventAt(d.lastEventAt ?? null)
    })
  }, [clientKey])

  async function saveDomain() {
    setDomainSaving(true); setDomainError(''); setDomainSaved(false)
    const res = await fetch(`/api/portal?key=${clientKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainInput }),
    })
    const data = await res.json()
    if (!res.ok) { setDomainError(data.error || 'Failed to save'); setDomainSaving(false); return }
    setClient(c => c ? { ...c, domain: data.domain } : c)
    setDomainSaved(true)
    setDomainSaving(false)
    setTimeout(() => setDomainSaved(false), 3000)
  }

  // Real widget health from the last consent event received (no static badge).
  // Active = event in last 48h; Idle = older; Not detected = never reported in.
  const health = (() => {
    if (lastEventAt === undefined) return { label: 'Checking…', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200', dot: 'bg-zinc-400' }
    if (lastEventAt === null) return { label: 'Not detected', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
    const ageH = (Date.now() - new Date(lastEventAt).getTime()) / 3_600_000
    if (ageH <= 48) return { label: 'Active', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' }
    return { label: 'Idle', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' }
  })()

  function ago(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

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
            <div className="bg-[#f4f4f7] border border-[#e8e8ee] rounded-xl p-4 font-mono text-xs text-[#7fdccf] break-all mb-3">
              {scriptTag}
            </div>
            <button onClick={copy}
              className="w-full py-2.5 rounded-xl bg-[#01A390] hover:bg-[#01A390] text-white text-sm font-semibold transition-colors">
              {copied ? '✓ Copied!' : '📋 Copy Embed Code'}
            </button>
          </div>

          {/* Site domain — controls which origins can post consent events */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1">Your Site Domain</h2>
            <p className="text-xs text-zinc-400 mb-3">Only consent events from this domain are recorded. Update this when you move from localhost to your live site.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={e => { setDomainInput(e.target.value); setDomainSaved(false) }}
                placeholder="yourstore.netlify.app"
                className="flex-1 text-sm border border-[#e8e8ee] rounded-xl px-3 py-2 bg-white text-[#1b1b29] placeholder:text-zinc-400 font-mono"
              />
              <button onClick={saveDomain} disabled={domainSaving}
                className="px-4 py-2 rounded-xl bg-[#01A390] hover:bg-[#01A390] text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
                {domainSaving ? 'Saving…' : domainSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            {domainError && <p className="text-xs text-red-500 mt-1.5">{domainError}</p>}
            <p className="text-[11px] text-zinc-400 mt-2">No <code className="font-mono">https://</code> needed. Subdomains match automatically (e.g. <code className="font-mono">shop.example.com</code> works for <code className="font-mono">example.com</code>).</p>
          </div>

          {/* Platform tabs */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Install Instructions</h2>
            <div className="flex gap-2 mb-5 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activePlatform === p.id ? 'bg-[#01A390] text-white' : 'bg-black/[0.04] text-zinc-500 hover:text-[#1b1b29]'}`}>
                  <span>{p.icon}</span>{p.name}
                </button>
              ))}
            </div>
            <ol className="space-y-3">
              {platform.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700">
                  <span className="w-5 h-5 rounded-full bg-[#01A390]/20 text-[#01A390] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
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
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${health.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`}></span>{health.label}
            </span>
          </div>
          {lastEventAt
            ? <p className="text-xs text-zinc-400 -mt-2 mb-3">Last consent event {ago(lastEventAt)}</p>
            : lastEventAt === null
              ? <p className="text-xs text-amber-600 -mt-2 mb-3">No events yet — install the embed code on your store to go live.</p>
              : null}
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
            <span className="w-3 h-3 rounded-sm" style={{ background: config?.primary_color || '#01A390' }}></span>
            Brand color {config?.primary_color || '#01A390'} · Category: <span className="capitalize">{config?.category?.replace(/_/g, ' ') || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
