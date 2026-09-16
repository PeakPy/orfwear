# Repository structure

```text
orfwear/
├── apps/
│   ├── web/                         # Next.js storefront + PWA (独立 deployable)
│   │   ├── public/                  # static + PWA manifest/icons
│   │   └── src/
│   │       ├── app/                 # App Router (shop / account / marketing)
│   │       ├── components/          # shared UI (glass, layout, product, cart)
│   │       ├── features/            # domain modules talking to API
│   │       ├── lib/api/             # HTTP client
│   │       ├── stores/              # client-only state
│   │       ├── styles/              # design tokens + globals
│   │       └── types/               # shared FE types
│   └── api/                         # Django + Ninja API (独立 deployable)
│       ├── config/                  # settings, urls, asgi/wsgi, celery, ninja root
│       ├── apps/
│       │   ├── common/              # base models, errors, middleware
│       │   ├── users/
│       │   ├── catalog/
│       │   ├── inventory/
│       │   ├── cart/
│       │   ├── orders/
│       │   ├── payments/            # + providers adapters
│       │   ├── shipping/
│       │   ├── marketing/
│       │   └── media/
│       ├── requirements/            # base / local / production / test
│       └── tests/
├── packages/contracts/              # OpenAPI + generated TS client
├── deploy/
│   ├── docker/                      # api/web Dockerfiles (dev + prod)
│   ├── compose/                     # local/dev/prod compose
│   └── nginx/                       # domain split sample
├── scripts/                         # bootstrap + codegen
├── docs/                            # architecture & conventions
└── .github/workflows/               # CI per app
```

## Split later

1. Move `apps/web` → `orfwear-web` repo (keep its Dockerfile)
2. Move `apps/api` → `orfwear-api` repo (keep its Dockerfile)
3. Keep `packages/contracts` published or copied into both
4. Remove root compose or turn it into an infra repo
