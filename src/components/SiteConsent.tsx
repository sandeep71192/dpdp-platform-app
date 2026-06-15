'use client'
import { useEffect } from 'react'

// Dogfooding: our own platform runs the consent widget we sell. This loads the
// widget for our own site (a real client_key in the DB), served from our own CDN
// endpoint just like any customer's. Honest config: essential-only, no tracking.
const SELF_KEY = 'a5e36a2611559d37d667bd018202364e'

export default function SiteConsent() {
  useEffect(() => {
    if (document.getElementById('dpdp-self-widget')) return
    const s = document.createElement('script')
    s.id = 'dpdp-self-widget'
    s.async = true
    s.src = `/w.js?id=${SELF_KEY}`
    document.body.appendChild(s)
  }, [])
  return null
}
