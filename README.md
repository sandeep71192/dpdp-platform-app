# DPDP Consent Platform

A DPDP Act 2023 consent-management platform for Indian D2C brands. Brands self-onboard,
get a hosted consent widget (embedded via one script tag), and see consent analytics +
an auditable compliance log. Built with Next.js 16, Supabase, and the Claude API.

## Surfaces

| Path | Who | What |
|---|---|---|
| `/get-started` | Brand (public) | Self-serve funnel: URL → AI-generated widget → review → account → portal |
| `/login` | Brand / Agency | Routes by role: brand → portal, super-admin → dashboard |
| `/portal/[clientKey]` | Brand | Their widget, analytics, compliance/audit export (auth-scoped) |
| `/dashboard` | Super-admin | All clients, cross-client analytics |
| `/w.js?id=KEY` | Public CDN | The per-client consent widget served to brand sites |

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev -- --port 3002
```

Open http://localhost:3002

## Environment variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`.

> `NEXT_PUBLIC_APP_URL` must be the live deployment URL in production — generated embed
> snippets and the widget's event API base read from it.

## Deploying to Vercel

1. Push this repo to GitHub (private).
2. Vercel → **Add New → Project** → import the repo (Next.js auto-detected).
3. **Settings → Environment Variables** → add all vars from `.env.example` with real values.
   Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://dpdp-platform.vercel.app`).
4. **Deploy.**
5. In **Supabase → Auth → URL Configuration**, add the Vercel domain to Site URL / redirect
   allow-list so login sessions persist.
6. (Optional, for a closed alpha) enable **Vercel Password Protection** (Pro plan).

## Database

Schema lives at `../dpdp-platform/schema.sql` (run once in the Supabase SQL editor).

## Status / known gaps before public launch

- `/api/consent` accepts unauthenticated writes (fine for a closed team trial; harden with
  domain-validation + rate-limiting before going public).
- Widget-health status in the portal is not yet a live heartbeat.

Demo accounts (super-admin and a sample brand) exist in Supabase and are shared with the
team separately — rotate these before any public exposure.

## Architecture notes

- This Next.js version renamed `middleware` → `proxy`; session refresh lives in `src/proxy.ts`.
- The consent widget (`src/lib/widget-js.ts`) is intentionally light-themed and self-contained;
  it enforces consent via Google Consent Mode v2 + `data-dpdp-purpose` script gating.
