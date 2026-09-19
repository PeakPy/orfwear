# ORF Wear (`orfwear.ir`)

Monorepo for the ORF fashion e-commerce platform.

Frontend and backend live in one repository for velocity, but each app is independently buildable, testable, and deployable with Docker.

## Layout

```text
orfwear/
├── apps/
│   ├── web/          # Next.js PWA (orfwear.ir)
│   ├── admin/        # Next.js staff panel (admin.orfwear.ir)
│   └── api/          # Django + Django Ninja (api.orfwear.ir)
├── packages/
│   ├── contracts/    # OpenAPI specs + generated TS client
│   └── design-tokens/# Shared CSS design tokens
├── deploy/
│   ├── docker/       # Per-app Dockerfiles
│   ├── compose/      # Local / prod compose files
│   └── nginx/        # Reverse proxy samples
├── scripts/          # Bootstrap & codegen helpers
└── docs/             # Architecture & conventions
```

## Quick start

```bash
cp .env.example .env
make bootstrap
make up
```

Local apps (common Phase 1 ports):

| App | Port | Notes |
|-----|------|--------|
| Web storefront | **3000** | `apps/web` — `npm run dev -- -p 3000` |
| API (Django Ninja) | **8001** | `apps/api` — `python manage.py runserver 0.0.0.0:8001` |
| Admin panel | **3001** | `apps/admin` — `npm run dev -- -p 3001` |

Prefer `/opt/homebrew/bin/npm` when Homebrew Node is installed.

- Web: http://localhost:3000
- Admin (Next): http://localhost:3001 — see `apps/admin/README.md`
- API docs: http://localhost:8001/api/docs (Docker/default may use 8000)
- Django Admin (fallback): http://localhost:8001/admin

## Independent deploy model

Each app has its own Dockerfile and can run alone:

```bash
# API only
docker build -f deploy/docker/api.Dockerfile -t orfwear-api apps/api

# Web only
docker build -f deploy/docker/web.Dockerfile -t orfwear-web apps/web
```

Later you can split into two repos by moving `apps/web` and `apps/api` without rewriting architecture.

## Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js + TypeScript + Tailwind + PWA |
| API | Django 5 + Django Ninja |
| DB | PostgreSQL |
| Cache / queue | Redis + Celery |
| Contracts | OpenAPI in `packages/contracts` |

See [docs/architecture.md](docs/architecture.md) and, before going live,
[docs/providers.md](docs/providers.md) for the payment gateway and SMS setup.
