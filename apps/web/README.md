# ORF Web

Next.js PWA storefront for ORF Wear (`orfwear.ir`).

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Structure

- `src/app` — routes
- `src/features` — domain UI modules
- `src/components/glass` — Liquid Glass surfaces
- `src/lib/api` — Django API client

This app has zero runtime dependency on the Django codebase; it only talks over HTTP/OpenAPI.
