'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { DPDP_CATEGORIES, CHILDREN_CATEGORIES } from '@/lib/categories'

interface PurposeGroup { id: string; label: string; description: string; necessary: boolean; enabled: boolean; dataPoints: string[] }
interface Draft {
  name: string; domain: string; logo: string; tagline: string
  colors: { primary: string; secondary: string; text: string }
  category: string; confidence: number; description: string; position: string
  purposeGroups: PurposeGroup[]; translations: Record<string, Record<string, string>>
}
type Step = 'url' | 'analyzing' | 'review' | 'account' | 'publishing'

export default function GetStarted() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [childrenAck, setChildrenAck] = useState(false)
  const [acct, setAcct] = useState({ email: '', password: '', owner_name: '' })
  const [previewHtml, setPreviewHtml] = useState('')

  // Live preview of the REAL widget, rebuilt whenever a preview-relevant field changes
  // (colour, position, enabled purposes) — name typing doesn't reload it.
  const previewSig = draft ? JSON.stringify([draft.colors.primary, draft.position, draft.purposeGroups.map(g => [g.id, g.enabled])]) : ''
  useEffect(() => {
    if (step !== 'review' || !draft) return
    let cancelled = false
    fetch('/api/onboard/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      .then(r => r.text()).then(html => { if (!cancelled) setPreviewHtml(html) }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, previewSig])

  const isChildren = draft ? CHILDREN_CATEGORIES.includes(draft.category) : false
  const inputCls = 'w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5 text-sm text-[#1b1b29] placeholder-zinc-600 outline-none focus:border-violet-500 transition-colors'
  const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider'

  function setD<K extends keyof Draft>(k: K, v: Draft[K]) { setDraft(d => d ? { ...d, [k]: v } : d) }

  async function analyze(e: React.FormEvent) {
    e.preventDefault(); setError(''); setStep('analyzing')
    try {
      const res = await fetch('/api/onboard/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setDraft(data.draft); setStep('review')
    } catch (err) { setError(err instanceof Error ? err.message : 'Analysis failed'); setStep('url') }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setError(''); setStep('publishing')
    try {
      const res = await fetch('/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...acct, ...draft, childrenAcknowledged: childrenAck }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create your account')
      // Establish a browser session, then land in the brand's own portal.
      const { error: signInErr } = await supabaseBrowser.auth.signInWithPassword({ email: acct.email, password: acct.password })
      if (signInErr) { router.push('/login'); return }
      router.push(`/portal/${data.client_key}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Signup failed'); setStep('account') }
  }

  function togglePurpose(id: string) {
    if (!draft) return
    setDraft({ ...draft, purposeGroups: draft.purposeGroups.map(g => g.id === id && !g.necessary ? { ...g, enabled: !g.enabled } : g) })
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#e8e8ee]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">🛡️</div>
          <div><div className="text-sm font-bold text-[#1b1b29] leading-tight">DPDP Consent</div><div className="text-[10px] text-zinc-500">for Indian D2C brands</div></div>
        </div>
        <Link href="/login" className="text-sm text-zinc-500 hover:text-[#1b1b29]">Already have an account? <span className="text-violet-600">Log in</span></Link>
      </header>

      <div className={(step === 'review' ? 'max-w-5xl' : 'max-w-2xl') + ' mx-auto px-6 py-12'}>
        {/* HERO + URL */}
        {(step === 'url' || step === 'analyzing') && (
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ background: 'linear-gradient(135deg,#1b1b29,#7c5ef0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Make your store DPDP-compliant in minutes
            </h1>
            <p className="text-base text-zinc-500 max-w-lg mx-auto mb-8">Enter your store URL. We&apos;ll generate a branded consent widget in 11 Indian languages, ready to embed on Shopify, Magento, Webflow, or any site.</p>
            {step === 'url' ? (
              <form onSubmit={analyze} className="flex gap-3 max-w-lg mx-auto">
                <input value={url} onChange={e => setUrl(e.target.value)} required placeholder="yourstore.com" className="flex-1 bg-[#f3f3f5] border-2 border-[#e8e8ee] rounded-xl px-4 py-3.5 text-[#1b1b29] outline-none focus:border-violet-500" />
                <button className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold px-6 rounded-xl shadow-lg shadow-violet-500/30">Generate →</button>
              </form>
            ) : (
              <div className="py-10"><div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-sm text-[#1b1b29]">Analysing {url}…</p><p className="text-xs text-zinc-500 mt-1">Classifying your brand and drafting consent copy in 11 languages</p></div>
            )}
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
            <p className="text-xs text-zinc-600 mt-6">🔒 No credit card. You only create an account once you&apos;re happy with the widget.</p>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && draft && (
          <div>
            <h2 className="text-2xl font-bold text-[#1b1b29] mb-1">Here&apos;s your widget</h2>
            <p className="text-sm text-zinc-500 mb-6">This is the real, live widget — click <span className="font-semibold text-violet-600">Customise</span> on it to see the full cookie disclosure. Tweak anything on the right, then create your account to go live.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* LEFT — live, interactive preview of the real widget */}
            <div className="lg:sticky lg:top-6">
              <div className="rounded-2xl overflow-hidden border border-[#e8e8ee] bg-[#f0f0f8] relative" style={{ height: 520 }}>
                {previewHtml
                  ? <iframe srcDoc={previewHtml} title="Live widget preview" className="w-full h-full border-0" sandbox="allow-scripts allow-popups" />
                  : <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 text-center">↑ Fully interactive — try Accept, Customise, and the language switcher. Free to preview; no account needed yet.</p>
            </div>
            {/* RIGHT — editable config */}
            <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                {draft.logo ? <img src={draft.logo} alt="" className="w-11 h-11 rounded-xl object-contain bg-black/[0.04]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: draft.colors.primary }}>{draft.name.charAt(0)}</div>}
                <div className="flex-1"><input value={draft.name} onChange={e => setD('name', e.target.value)} className="bg-transparent text-base font-bold text-[#1b1b29] outline-none border-b border-transparent focus:border-violet-500 w-full" /><div className="text-xs text-zinc-500">{draft.domain}</div></div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">{draft.confidence}% confident</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Category</label><select value={draft.category} onChange={e => setD('category', e.target.value)} className={inputCls}>{DPDP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
                <div><label className={labelCls}>Position</label><select value={draft.position} onChange={e => setD('position', e.target.value)} className={inputCls}><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option></select></div>
              </div>
              <div><label className={labelCls}>Brand Colour</label><div className="flex items-center gap-3"><input type="color" value={draft.colors.primary} onChange={e => setD('colors', { ...draft.colors, primary: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent border border-[#e8e8ee] cursor-pointer" /><input value={draft.colors.primary} onChange={e => setD('colors', { ...draft.colors, primary: e.target.value })} className={inputCls + ' font-mono'} /></div></div>
              {isChildren && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-400 mb-1">⚠️ Children&apos;s data (DPDP s.9)</div>
                  <p className="text-[11px] text-amber-300/80 mb-2">This category needs verifiable parental consent and bans behavioural targeting of children — not yet automated. Re-classify, or acknowledge you&apos;ll handle parental consent yourself.</p>
                  <label className="flex items-center gap-2 text-[11px] text-amber-200 cursor-pointer"><input type="checkbox" checked={childrenAck} onChange={e => setChildrenAck(e.target.checked)} /> I understand and will handle parental consent separately.</label>
                </div>
              )}
              <div>
                <label className={labelCls}>Consent Purposes</label>
                <div className="space-y-2">{draft.purposeGroups.map(g => (
                  <div key={g.id} className="flex items-center gap-3 bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5">
                    <div className="flex-1"><div className="text-sm text-[#1b1b29]">{g.label}{g.necessary && <span className="text-[10px] text-zinc-500"> · always on</span>}</div><div className="text-[11px] text-zinc-600">{g.description}</div></div>
                    <button type="button" onClick={() => togglePurpose(g.id)} disabled={g.necessary} className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0" style={{ background: (g.necessary || g.enabled) ? draft.colors.primary : '#3a3a4a', opacity: g.necessary ? 0.6 : 1, cursor: g.necessary ? 'not-allowed' : 'pointer' }}><span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: (g.necessary || g.enabled) ? 'calc(100% - 20px)' : '4px' }} /></button>
                  </div>
                ))}</div>
              </div>
            </div>
            </div>
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
            <div className="flex gap-3 mt-6 max-w-lg">
              <button onClick={() => setStep('url')} className="px-5 py-3 rounded-xl border border-[#e8e8ee] text-sm text-zinc-500 hover:text-[#1b1b29]">← Back</button>
              <button onClick={() => { setError(''); setStep('account') }} disabled={isChildren && !childrenAck} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold">Looks good — create my account →</button>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {(step === 'account' || step === 'publishing') && draft && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#1b1b29] mb-1">Create your account</h2>
            <p className="text-sm text-zinc-500 mb-6">This is where you&apos;ll manage {draft.name}&apos;s widget and see consent analytics.</p>
            {step === 'publishing' ? (
              <div className="py-12 text-center"><div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-sm text-[#1b1b29]">Creating your account & publishing your widget…</p></div>
            ) : (
              <form onSubmit={publish} className="space-y-4">
                <div><label className={labelCls}>Your Name</label><input value={acct.owner_name} onChange={e => setAcct({ ...acct, owner_name: e.target.value })} className={inputCls} placeholder="Ghazal Alagh" /></div>
                <div><label className={labelCls}>Work Email *</label><input type="email" required value={acct.email} onChange={e => setAcct({ ...acct, email: e.target.value })} className={inputCls} placeholder="founder@brand.in" /></div>
                <div><label className={labelCls}>Password *</label><input type="password" required value={acct.password} onChange={e => setAcct({ ...acct, password: e.target.value })} className={inputCls} placeholder="At least 8 characters" /></div>
                {error && <div className="text-sm text-red-400">{error}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep('review')} className="px-5 py-3 rounded-xl border border-[#e8e8ee] text-sm text-zinc-500 hover:text-[#1b1b29]">← Back</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold">Publish my widget →</button>
                </div>
                <p className="text-[11px] text-zinc-600 text-center pt-1">By continuing you agree your store is the Data Fiduciary and this tool acts as your processor under the DPDP Act 2023.</p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
