# ORF Web

Next.js PWA storefront for ORF Wear (`orfwear.ir`). Mobile-only shell (max ~430px), Persian RTL.

## Local ports

| App | URL |
|-----|-----|
| Web (this app) | http://localhost:3000 |
| API | http://localhost:8001 |
| Admin | http://localhost:3001 |

Use `/opt/homebrew/bin/npm` if `npm` is not on your PATH.

## Run

```bash
cp .env.example .env.local
# point API at local Django: NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
npm install
npm run dev -- -p 3000
```

## Structure

- `src/app` — routes (shop, account, trust pages)
- `src/features` — domain UI modules
- `src/components/layout` — mobile shell, header, bottom nav
- `src/components/glass` — frosted chrome only (header / dock / sheets)
- `public/sw.js` — lightweight shell service worker (production)
- `src/lib/api` — Django API client

Trust pages (`/about`, `/size-guide`, `/shipping`, `/returns`, `/faq`, `/contact`, `/privacy`, `/terms`) are server components with static copy.

This app has zero runtime dependency on the Django codebase; it only talks over HTTP/OpenAPI.
