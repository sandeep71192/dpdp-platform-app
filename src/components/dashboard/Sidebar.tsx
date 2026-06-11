'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: '◈' },
  { href: '/dashboard/clients', label: 'Clients', icon: '🏢' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: '🔌' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-[#ffffff] border-r border-[#e8e8ee] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e8e8ee]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm shadow-lg shadow-violet-500/30">
            🛡️
          </div>
          <div>
            <div className="text-sm font-bold text-[#1b1b29] leading-tight">DPDP</div>
            <div className="text-[10px] text-zinc-500 leading-tight">Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon }) => {
          const active = href === '/dashboard' ? path === href : path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20'
                  : 'text-zinc-500 hover:text-[#1b1b29] hover:bg-black/[0.04]'
              )}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-[#e8e8ee]">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-600 font-bold">A</div>
          <div>
            <div className="text-xs font-semibold text-[#1b1b29]">Admin</div>
            <div className="text-[10px] text-zinc-500">Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
