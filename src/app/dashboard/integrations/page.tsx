import { platformIcon } from '@/lib/utils'

const platforms = [
  { id: 'shopify', name: 'Shopify', desc: 'Auto-inject via Shopify Script Tag API. One-click install for any Shopify store.', status: 'available', docs: '#' },
  { id: 'woocommerce', name: 'WooCommerce', desc: 'WordPress plugin for WooCommerce stores. Paste API key, widget appears automatically.', status: 'coming_soon', docs: '#' },
  { id: 'webflow', name: 'Webflow', desc: 'Paste one script tag into Webflow site settings. Works on all Webflow plans.', status: 'available', docs: '#' },
  { id: 'wix', name: 'Wix', desc: 'Add via Wix Velo or custom code block in the Wix editor.', status: 'coming_soon', docs: '#' },
  { id: 'framer', name: 'Framer', desc: 'Custom code component for Framer sites. Drag and drop setup.', status: 'available', docs: '#' },
  { id: 'custom', name: 'Custom / Any Platform', desc: 'Paste a single script tag before </body>. Works on any website.', status: 'available', docs: '#' },
]

export default function IntegrationsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1b1b29] tracking-tight">Integrations</h1>
        <p className="text-sm text-zinc-500 mt-1">Connect D2C platforms to deploy consent widgets automatically</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {platforms.map(p => (
          <div key={p.id} className="bg-[#ffffff] border border-[#e8e8ee] rounded-2xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/[0.04] flex items-center justify-center text-2xl flex-shrink-0">
              {platformIcon(p.id)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#1b1b29]">{p.name}</h3>
                {p.status === 'coming_soon' ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Coming Soon</span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Available</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">{p.desc}</p>
              <button
                disabled={p.status === 'coming_soon'}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#01A390] hover:bg-[#01A390] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">
                {p.status === 'coming_soon' ? 'Notify Me' : 'Setup Guide →'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shopify deep-dive */}
      <div className="mt-6 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🛍️</div>
          <div>
            <h3 className="text-base font-bold text-[#1b1b29] mb-1">Shopify Integration — How it works</h3>
            <ol className="text-sm text-zinc-500 space-y-1 list-decimal list-inside">
              <li>Client installs your Shopify app (or you inject via Script Tag API using their store URL + token)</li>
              <li>Widget script is auto-injected into their storefront theme</li>
              <li>Consent events are logged to your Supabase in real time</li>
              <li>Client sees their analytics in the dashboard</li>
            </ol>
            <div className="mt-4 text-xs text-zinc-500">Shopify App setup requires a Partner account. We'll build this in the next sprint.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
