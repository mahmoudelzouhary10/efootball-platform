# Lighthouse — mobile audits

Lighthouse 12, default mobile configuration (Moto G Power emulation, simulated slow 4G, 4× CPU slowdown),
headless Chrome, production builds of API and web on one machine. API traffic goes through the Next.js
development rewrite (in production a reverse proxy serves `/api` directly).

Reproduce (API on :4100 and web on :3100, built as in `apps/web/package.json` → `test:e2e`):

```bash
npx lighthouse@12 http://localhost:3100/ --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new" --output=html --output-path=./lighthouse-home.html
```

## Results — 2026-11-21 (Phase 2)

| Page                 | Performance | Accessibility | Best practices | SEO | LCP       |
| -------------------- | ----------- | ------------- | -------------- | --- | --------- |
| `/` (Arabic home)    | 93          | 100           | 100            | 100 | 3.1 s     |
| `/en` (English)      | 94          | 100           | 100            | 100 | 2.8 s     |
| `/clans`             | 93          | 100           | 100            | 100 | 2.7 s     |
| `/login`             | 91          | 100           | 100            | 100 | 2.9 s     |
| `/register`          | 91          | 100           | 100            | 100 | 2.9 s     |
| `/clans/:tag`        | 81–83       | 100           | 100            | 100 | 3.7–4.0 s |
| `/players/:username` | 95          | 100           | 100            | 100 | 2.5 s     |

Fixes made because of these audits: faint text contrast raised to ≥ 4.5:1; heading order on discovery
cards; underlined inline links; hero headline no longer fades in (it was the LCP element); fonts
self-hosted and preloaded per locale; two unused font weights removed; the clan hero crest loads eagerly
with high priority.

## Outstanding

- **Clan page performance (81–83).** Its LCP element is the 512×512 logo. Fix: generate a 256 px variant at
  upload and serve with `srcset`, and serve `/api/v1/media` directly from the reverse proxy in production.
- Authenticated pages (dashboard, manage, admin) are not yet audited; they need a scripted login in the run.
- Not yet automated in CI (Lighthouse CI budget). Tracked for Phase 6.
