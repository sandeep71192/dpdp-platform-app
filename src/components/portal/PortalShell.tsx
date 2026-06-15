'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PortalClient {
  id: string
  name: string
  domain: string
  logo_url: string | null
  plan: string
  client_key: string
}

export default function PortalShell({ clientKey, children }: { clientKey: string; children: React.ReactNode }) {
  const path = usePathname()
  const [client, setClient] = useState<PortalClient | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/portal?key=${clientKey}`)
      .then(r => r.json())
      .then(d => { if (d.client) setClient(d.client); else setNotFound(true) })
      .catch(() => setNotFound(true))
  }, [clientKey])

  const base = `/portal/${clientKey}`
  const nav = [
    { href: base, label: 'Overview', icon: '◈' },
    { href: `${base}/widget`, label: 'My Widget', icon: '🛡️' },
    { href: `${base}/customize`, label: 'Customize', icon: '🎨' },
    { href: `${base}/analytics`, label: 'Analytics', icon: '📊' },
    { href: `${base}/consent-insights`, label: 'Consent Insights', icon: '🤝' },
    { href: `${base}/compliance`, label: 'Compliance', icon: '📋' },
  ]

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-lg font-bold text-[#1b1b29]">Portal not found</h1>
          <p className="text-sm text-zinc-500 mt-1">This portal link is invalid or has been deactivated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f7f6f3] overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-[#ffffff] border-r border-[#e8e8ee] flex flex-col">
        {/* Client brand header */}
        <div className="px-5 py-5 border-b border-[#e8e8ee]">
          <div className="flex items-center gap-3">
            {client?.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="w-9 h-9 rounded-lg object-contain bg-black/[0.04] flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                {client?.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#1b1b29] leading-tight truncate">{client?.name || 'Loading…'}</div>
              <div className="text-[10px] text-zinc-500 leading-tight truncate">{client?.domain || ''}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon }) => {
            const active = href === base ? path === href : path.startsWith(href)
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' : 'text-zinc-500 hover:text-[#1b1b29] hover:bg-black/[0.04]')}>
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[#e8e8ee]">
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Plan</div>
            <div className="text-sm font-semibold text-violet-600 capitalize">{client?.plan || '—'}</div>
          </div>
          <div className="text-[10px] text-zinc-600 text-center mt-3">🔒 DPDP Act 2023 Compliant</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
