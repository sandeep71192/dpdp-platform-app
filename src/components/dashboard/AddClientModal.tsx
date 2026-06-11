'use client'
import { useState } from 'react'
import { DPDP_CATEGORIES, CHILDREN_CATEGORIES } from '@/lib/categories'

interface PurposeGroup { id: string; label: string; description: string; necessary: boolean; enabled: boolean; dataPoints: string[] }
interface Draft {
  name: string; domain: string; logo: string; tagline: string
  colors: { primary: string; secondary: string; text: string }
  category: string; confidence: number; description: string; position: string
  purposeGroups: PurposeGroup[]
  translations: Record<string, Record<string, string>>
}

type Step = 'form' | 'analyzing' | 'review' | 'publishing' | 'done'

export default function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ domain: '', owner_name: '', owner_email: '', phone: '', plan: 'free' })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [clientKey, setClientKey] = useState('')
  const [childrenAck, setChildrenAck] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const scriptTag = `<script src="${appUrl}/w.js?id=${clientKey}"></script>`
  const isChildren = draft ? CHILDREN_CATEGORIES.includes(draft.category) : false

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function setD<K extends keyof Draft>(k: K, v: Draft[K]) { setDraft(d => d ? { ...d, [k]: v } : d) }

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStep('analyzing')
    try {
      const res = await fetch('/api/onboard/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setDraft(data.draft)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStep('form')
    }
  }

  async function publish() {
    if (!draft) return
    setError('')
    setStep('publishing')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, ...draft,
          childrenAcknowledged: childrenAck,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      setClientKey(data.client_key)
      setStep('done')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
      setStep('review')
    }
  }

  function togglePurpose(id: string) {
    if (!draft) return
    setDraft({ ...draft, purposeGroups: draft.purposeGroups.map(g => g.id === id && !g.necessary ? { ...g, enabled: !g.enabled } : g) })
  }
  function setCopy(field: 'title' | 'body', value: string) {
    if (!draft) return
    const en = { ...(draft.translations.en || {}), [field]: value }
    setDraft({ ...draft, translations: { ...draft.translations, en } })
  }

  const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider'
  const inputCls = 'w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5 text-sm text-[#1b1b29] placeholder-zinc-600 outline-none focus:border-violet-500 transition-colors'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e8ee] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1b1b29]">Add New Client</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === 'form' && 'Enter the brand details to analyse'}
              {step === 'analyzing' && 'Analysing with Claude…'}
              {step === 'review' && 'Review & edit before publishing'}
              {step === 'publishing' && 'Publishing…'}
              {step === 'done' && 'Client is live'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-[#1b1b29] transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-[#e8e8ee] flex-shrink-0">
            {['Details', 'Review', 'Publish'].map((s, i) => {
              const active = (step === 'form' && i === 0) || ((step === 'analyzing' || step === 'review') && i === 1) || (step === 'publishing' && i === 2)
              const done = (i === 0 && step !== 'form') || (i === 1 && (step === 'publishing'))
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${done ? 'bg-green-500/20 text-green-400' : active ? 'bg-violet-600 text-white' : 'bg-black/[0.04] text-zinc-500'}`}>{done ? '✓' : i + 1}</span>
                  <span className={`text-xs ${active ? 'text-[#1b1b29]' : 'text-zinc-500'}`}>{s}</span>
                  {i < 2 && <span className="text-zinc-700 mx-1">—</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 mb-4">{error}</div>}

          {/* STEP: FORM */}
          {step === 'form' && (
            <form onSubmit={analyze} className="space-y-4" id="onboard-form">
              <div>
                <label className={labelCls}>Website URL *</label>
                <input required value={form.domain} onChange={e => setF('domain', e.target.value)} className={inputCls} placeholder="mamaearth.in" />
                <p className="text-[11px] text-zinc-600 mt-1">We&apos;ll fetch the site and let Claude draft the widget — you review before anything goes live.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Owner Name</label><input value={form.owner_name} onChange={e => setF('owner_name', e.target.value)} className={inputCls} placeholder="Ghazal Alagh" /></div>
                <div><label className={labelCls}>Owner Email *</label><input required type="email" value={form.owner_email} onChange={e => setF('owner_email', e.target.value)} className={inputCls} placeholder="founder@brand.in" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e => setF('phone', e.target.value)} className={inputCls} placeholder="+91 …" /></div>
                <div><label className={labelCls}>Plan</label>
                  <select value={form.plan} onChange={e => setF('plan', e.target.value)} className={inputCls}>
                    <option value="free">Free</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* STEP: ANALYZING / PUBLISHING */}
          {(step === 'analyzing' || step === 'publishing') && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-[#1b1b29] font-medium">{step === 'analyzing' ? `Analysing ${form.domain}…` : 'Publishing & generating widget…'}</p>
              <p className="text-xs text-zinc-500 mt-1">{step === 'analyzing' ? 'Classifying brand, extracting colours, drafting 11 languages' : 'Saving config and issuing the embed code'}</p>
            </div>
          )}

          {/* STEP: REVIEW */}
          {step === 'review' && draft && (
            <div className="space-y-5">
              {/* Brand head */}
              <div className="flex items-center gap-3">
                {draft.logo
                  ? <img src={draft.logo} alt="" className="w-11 h-11 rounded-xl object-contain bg-black/[0.04]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: draft.colors.primary }}>{draft.name.charAt(0)}</div>}
                <div className="flex-1">
                  <input value={draft.name} onChange={e => setD('name', e.target.value)} className="bg-transparent text-base font-bold text-[#1b1b29] outline-none border-b border-transparent focus:border-violet-500 w-full" />
                  <div className="text-xs text-zinc-500">{draft.domain}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">{draft.confidence}% confident</span>
              </div>
              <p className="text-xs text-zinc-500 -mt-2">{draft.description}</p>

              {/* Category + position + color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>DPDP Category</label>
                  <select value={draft.category} onChange={e => setD('category', e.target.value)} className={inputCls}>
                    {DPDP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Banner Position</label>
                  <select value={draft.position} onChange={e => setD('position', e.target.value)} className={inputCls}>
                    <option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Brand Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={draft.colors.primary} onChange={e => setD('colors', { ...draft.colors, primary: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent border border-[#e8e8ee] cursor-pointer" />
                  <input value={draft.colors.primary} onChange={e => setD('colors', { ...draft.colors, primary: e.target.value })} className={inputCls + ' font-mono'} />
                </div>
              </div>

              {/* Children warning */}
              {isChildren && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-400 mb-1">⚠️ Children&apos;s data category (DPDP s.9)</div>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed mb-2">This category involves minors. DPDP Act 2023 requires verifiable parental consent and bans behavioural targeting of children — not yet supported by the widget. Re-classify, or acknowledge you will handle parental consent separately.</p>
                  <label className="flex items-center gap-2 text-[11px] text-amber-200 cursor-pointer">
                    <input type="checkbox" checked={childrenAck} onChange={e => setChildrenAck(e.target.checked)} />
                    I understand and will handle parental consent outside this widget.
                  </label>
                </div>
              )}

              {/* Purpose groups */}
              <div>
                <label className={labelCls}>Consent Purposes</label>
                <div className="space-y-2">
                  {draft.purposeGroups.map(g => (
                    <div key={g.id} className="flex items-center gap-3 bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-3 py-2.5">
                      <div className="flex-1">
                        <div className="text-sm text-[#1b1b29]">{g.label} {g.necessary && <span className="text-[10px] text-zinc-500">· always on</span>}</div>
                        <div className="text-[11px] text-zinc-600">{g.description}</div>
                      </div>
                      <button type="button" onClick={() => togglePurpose(g.id)} disabled={g.necessary}
                        className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${g.necessary || g.enabled ? '' : ''}`}
                        style={{ background: (g.necessary || g.enabled) ? draft.colors.primary : '#3a3a4a', opacity: g.necessary ? 0.6 : 1, cursor: g.necessary ? 'not-allowed' : 'pointer' }}>
                        <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: (g.necessary || g.enabled) ? 'calc(100% - 20px)' : '4px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable EN copy */}
              <div>
                <label className={labelCls}>Notice Copy (English — others auto-translated)</label>
                <input value={draft.translations.en?.title || ''} onChange={e => setCopy('title', e.target.value)} className={inputCls + ' mb-2'} placeholder="Title" />
                <textarea value={draft.translations.en?.body || ''} onChange={e => setCopy('body', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="Body" />
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && (
            <div>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-base font-bold text-[#1b1b29]">{draft?.name} is live!</h3>
                <p className="text-sm text-zinc-500 mt-1">Embed this on any platform — Shopify, Magento, Webflow, or custom.</p>
              </div>
              <div className="bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl p-4 mb-4">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Embed Script Tag</div>
                <code className="text-xs text-violet-300 break-all">{scriptTag}</code>
              </div>
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 mb-4 text-xs text-zinc-500">
                <div className="font-semibold text-[#1b1b29] mb-1">Client portal link</div>
                <code className="text-violet-300 break-all">{appUrl}/portal/{clientKey}</code>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard.writeText(scriptTag)} className="flex-1 py-2.5 rounded-xl border border-[#e8e8ee] text-sm text-zinc-700 hover:text-[#1b1b29] hover:border-violet-500 transition-colors">📋 Copy Script</button>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Done</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === 'form' || step === 'review') && (
          <div className="flex gap-3 px-6 py-4 border-t border-[#e8e8ee] flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e8e8ee] text-sm text-zinc-500 hover:text-[#1b1b29] hover:border-zinc-500 transition-colors">Cancel</button>
            {step === 'form' && <button type="submit" form="onboard-form" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Analyse →</button>}
            {step === 'review' && <button type="button" onClick={publish} disabled={isChildren && !childrenAck} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">Publish & Generate Widget →</button>}
          </div>
        )}
      </div>
    </div>
  )
}
