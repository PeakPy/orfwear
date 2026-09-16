# ORF Wear Architecture

## Goals

- Fast product development in a single repo
- Clear bounded contexts on the API
- Frontend and backend independently dockerized
- Easy future split into separate repositories / services

## High-level

```text
Browser / PWA (orfwear.ir)
        │
        ▼
   apps/web  (Next.js)
        │  HTTPS JSON
        ▼
   apps/api  (Django + Ninja)   api.orfwear.ir
        │
   ┌────┴────┐
Postgres   Redis → Celery workers
```

## Why monorepo, separate apps

`apps/web` and `apps/api` share **no runtime code**.
They only share:

- OpenAPI contracts in `packages/contracts`
- Compose/Makefiles for local DX
- Docs and CI orchestration

That means tomorrow you can:

1. Move `apps/web` to `orfwear-web`
2. Move `apps/api` to `orfwear-api`
3. Keep using the same Dockerfiles almost unchanged

## Frontend structure (`apps/web`)

- `src/app` — routes (App Router), marketing/shop/account route groups
- `src/features` — business UI modules (catalog, cart, checkout, auth)
- `src/components` — shared presentational UI (`ui`, `glass`, `layout`)
- `src/lib/api` — typed HTTP client against Django
- `src/stores` — client state only when server state is not enough

Rule: features own their hooks/components; shared UI stays dumb.

## Backend structure (`apps/api`)

Django project config lives in `config/`.
Domain apps live in `apps/` as bounded contexts:

| App | Responsibility |
|-----|----------------|
| `common` | base models, errors, pagination, shared schemas |
| `users` | accounts, auth, profiles |
| `catalog` | products, variants, collections, categories |
| `inventory` | stock, reservations |
| `cart` | cart sessions / lines |
| `orders` | order lifecycle |
| `payments` | payment intents, provider adapters |
| `shipping` | rates, addresses, fulfillment hooks |
| `marketing` | banners, campaigns, homepage modules |
| `media` | uploads, image metadata |

Layering inside each app:

```text
api/        → HTTP (Ninja routers)
schemas/    → request/response DTOs
services/   → use-cases / application logic
models/     → persistence
admin/      → Django admin
```

Routers must not contain business rules. Services must not import HTTP objects.

## API versioning

All public endpoints under `/api/v1/...`.
Breaking changes go to `/api/v2`.

## Auth model (initial)

- Browser/PWA uses httpOnly secure cookies (same-site friendly behind reverse proxy)
- Mobile / future clients can use token endpoints later without rewriting domain services

## Separation readiness checklist

- [x] Separate Dockerfiles for web and api
- [x] Separate env examples
- [x] No shared Python/TS runtime package required to boot
- [x] OpenAPI as the contract boundary
- [ ] CDN for media
- [ ] Separate CI deploy pipelines per app (scaffolded)

## Liquid Glass / PWA

Visual effects stay 100% in `apps/web`.
Backend never knows about glass UI. Keep refraction limited to nav/hero surfaces.
