export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform configuration</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Supabase */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[#1b1b29] mb-4">🗄️ Supabase Connection</h2>
          <div className="space-y-3">
            {['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].map(k => (
              <div key={k}>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">{k}</label>
                <input readOnly value="Set in .env.local"
                  className="w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-4 py-2.5 text-sm text-zinc-500 outline-none" />
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-zinc-600">Configure these in your <code className="text-[#01A390]">.env.local</code> file. Never commit secrets to git.</div>
        </div>

        {/* Anthropic */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[#1b1b29] mb-4">🤖 Claude AI</h2>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">ANTHROPIC_API_KEY</label>
            <input readOnly value="Set in .env.local"
              className="w-full bg-[#f3f3f5] border border-[#e8e8ee] rounded-xl px-4 py-2.5 text-sm text-zinc-500 outline-none" />
          </div>
          <div className="mt-3 text-xs text-zinc-600">Used for brand classification and translation generation via claude-sonnet-4-6.</div>
        </div>

        {/* Setup Checklist */}
        <div className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[#1b1b29] mb-4">✅ Setup Checklist</h2>
          <div className="space-y-3">
            {[
              { label: 'Create Supabase project', done: false, link: 'https://supabase.com' },
              { label: 'Run schema.sql in Supabase SQL editor', done: false, link: '#' },
              { label: 'Add env vars to .env.local', done: false, link: '#' },
              { label: 'Add first client', done: false, link: '/dashboard/clients' },
              { label: 'Deploy CDN widget (w.js)', done: false, link: '#' },
              { label: 'Connect Shopify integration', done: false, link: '/dashboard/integrations' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.done ? 'border-green-500 bg-green-500/20' : 'border-[#e8e8ee]'}`}>
                  {item.done && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <span className={`text-sm ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-700'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
