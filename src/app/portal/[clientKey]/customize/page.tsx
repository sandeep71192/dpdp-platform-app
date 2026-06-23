'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface PurposeGroup { id: string; label: string; description: string; necessary: boolean; enabled: boolean; dataPoints: string[]; trackers?: unknown[] }
interface Config { primary_color: string; position: string; font: string; layout: string; heroImage: string; category: string; purpose_groups: PurposeGroup[]; translations: Record<string, Record<string, string>> }

export default function CustomizePage() {
  const { clientKey } = useParams<{ clientKey: string }>()
  const [client, setClient] = useState<{ name: string } | null>(null)
  const [cfg, setCfg] = useState<Config | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal?key=${clientKey}`).then(r => r.json()).then(d => {
      if (d.client) setClient(d.client)
      if (d.config) setCfg({
        primary_color: d.config.primary_color || '#01A390',
        position: d.config.position || 'bottom-right',
        font: d.config.font_family || 'inherit',
        layout: d.config.layout || 'card',
        heroImage: d.config.hero_image || '',
        category: d.config.category,
        purpose_groups: d.config.purpose_groups || [],
        translations: d.config.translations || {},
      })
    })
  }, [clientKey])

  // Live preview, rebuilt when an editable field changes.
  const sig = cfg ? JSON.stringify([cfg.primary_color, cfg.position, cfg.font, cfg.layout, cfg.heroImage, cfg.purpose_groups.map(g => [g.id, g.enabled])]) : ''
  useEffect(() => {
    if (!cfg) return
    let cancelled = false
    const draft = { name: client?.name || 'Your Store', colors: { primary: cfg.primary_color }, position: cfg.position, font: cfg.font, layout: cfg.layout, heroImage: cfg.heroImage, purposeGroups: cfg.purpose_groups, translations: cfg.translations }
    fetch('/api/onboard/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      .then(r => r.text()).then(html => { if (!cancelled) setPreviewHtml(html) }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  function set<K extends keyof Config>(k: K, v: Config[K]) { setCfg(c => c ? { ...c, [k]: v } : c); setSaved(false) }
  function togglePurpose(id: string) {
    if (!cfg) return
    set('purpose_groups', cfg.purpose_groups.map(g => g.id === id && !g.necessary ? { ...g, enabled: !g.enabled } : g))
  }

  async function save() {
    if (!cfg) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/portal/config', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: clientKey, primary_color: cfg.primary_color, position: cfg.position, font: cfg.font, layout: cfg.layout, heroImage: cfg.heroImage, purposeGroups: cfg.purpose_groups }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not save')
      setSaved(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5 text-sm text-[#1b1b29] outline-none focus:border-violet-500'
  const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider'

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Customize Widget</h1>
        <p className="text-sm text-zinc-500 mt-1">Change your widget and re-publish — updates go live within a few minutes.</p>
      </div>

      {!cfg ? (
        <div className="text-sm text-zinc-500">Loading your widget…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Live preview */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl overflow-hidden border border-[#e8e8ee] bg-[#f0f0f8] relative" style={{ height: 520 }}>
              {previewHtml
                ? <iframe srcDoc={previewHtml} title="Live widget preview" className="w-full h-full border-0" sandbox="allow-scripts allow-popups" />
                : <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 text-center">Live preview — click Customise on the widget to see the full disclosure.</p>
          </div>

          {/* Controls */}
          <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Brand Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={cfg.primary_color} onChange={e => set('primary_color', e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-[#e8e8ee] cursor-pointer" />
                  <input value={cfg.primary_color} onChange={e => set('primary_color', e.target.value)} className={inputCls + ' font-mono'} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <select value={cfg.position} onChange={e => set('position', e.target.value)} className={inputCls}>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Layout</label>
                <select value={cfg.layout} onChange={e => set('layout', e.target.value)} className={inputCls}>
                  <option value="card">Floating card</option>
                  <option value="bar">Bottom bar</option>
                  <option value="pill">Compact pill</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Font</label>
                <select value={cfg.font} onChange={e => set('font', e.target.value)} className={inputCls}>
                  <option value="inherit">Match my site</option>
                  <option value="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">System sans</option>
                  <option value="Inter,system-ui,sans-serif">Inter</option>
                  <option value="Poppins,system-ui,sans-serif">Poppins</option>
                  <option value="Georgia,Cambria,serif">Serif</option>
                  <option value="ui-monospace,Menlo,monospace">Mono</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Hero image URL <span className="text-zinc-400 normal-case">(optional — blank uses a brand-tinted illustration)</span></label>
              <input value={cfg.heroImage} onChange={e => set('heroImage', e.target.value)} placeholder="https://…/hero.jpg" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Consent Purposes</label>
              <div className="space-y-2">
                {cfg.purpose_groups.map(g => (
                  <div key={g.id} className="flex items-center gap-3 bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1b1b29]">{g.label}{g.necessary && <span className="text-[10px] text-zinc-500"> · always on</span>}</div>
                      <div className="text-[11px] text-zinc-600 truncate">{g.description}</div>
                    </div>
                    <button type="button" onClick={() => togglePurpose(g.id)} disabled={g.necessary}
                      className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
                      style={{ background: (g.necessary || g.enabled) ? cfg.primary_color : '#cbd5e1', opacity: g.necessary ? 0.6 : 1, cursor: g.necessary ? 'not-allowed' : 'pointer' }}>
                      <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: (g.necessary || g.enabled) ? 'calc(100% - 20px)' : '4px' }} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">Turn a purpose off to remove it from your widget entirely. Essential stays on (required to run orders).</p>
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={save} disabled={saving}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {saving ? 'Publishing…' : 'Save & re-publish'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Published — live within a few minutes</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
