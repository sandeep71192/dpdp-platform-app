'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    // Route by role: super_admin → agency dashboard, client_admin → their portal.
    try {
      const res = await fetch('/api/me')
      const me = await res.json()
      if (me.role === 'super_admin') router.push('/dashboard')
      else if (me.client_key) router.push(`/portal/${me.client_key}`)
      else router.push('/dashboard')
    } catch { router.push('/dashboard') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#01A390] to-[#017d6e] flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-[#01A390]/30">
            🛡️
          </div>
          <h1 className="text-xl font-bold text-[#1b1b29]">DPDP Platform</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-4 py-3 text-sm text-[#1b1b29] placeholder-zinc-600 outline-none focus:border-[#01A390] transition-colors"
                placeholder="you@brand.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-4 py-3 text-sm text-[#1b1b29] placeholder-zinc-600 outline-none focus:border-[#01A390] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#01A390] to-[#017d6e] hover:from-[#01A390] hover:to-[#01A390] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#01A390]/20"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          New here? <Link href="/get-started" className="text-[#01A390] hover:text-[#7fdccf] font-medium">Generate your widget →</Link>
        </p>
        <p className="text-center text-xs text-zinc-600 mt-4">
          DPDP Act 2023 Compliant · India
        </p>
      </div>
    </div>
  )
}
