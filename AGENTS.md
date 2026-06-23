<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Always update the product tracker after shipping a feature

When you build and verify a feature in this repo, log it to the local product tracker as the **last step**, before summarising to the user. This keeps `what shipped` accurate without anyone remembering to do it.

Run:

```
node /Users/bsarunsandeep/Documents/product-tracker/scripts/track.mjs \
  --title "<concise feature name>" \
  --stage shipped \
  --module widget|portal|admin|platform \
  --notes "<one-plain-English-sentence of what changed and why>"
```

Rules:
- It's idempotent — matching an existing tracker title updates it (use this to move a Backlog/Up-Next item to `shipped`); otherwise it appends a new one.
- `--stage` may be `backlog | next | building | shipped`. Use `building` when you start something multi-session, `shipped` when verified.
- Pick the `--module` that matches what you touched: `widget` (the /w.js consent widget), `portal` (client dashboard), `admin` (super-admin/onboarding), `platform` (API/DB/shared).
- Write `--notes` for a non-technical reader (it shows in the tracker UI).
- The tracker reads `data/board.json` directly, so this works whether or not its dev server is running. Don't ask permission for this step — it's part of "done".
