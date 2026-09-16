# ORF Wear (`orfwear.ir`)

Monorepo for the ORF fashion e-commerce platform.

Frontend and backend live in one repository for velocity, but each app is independently buildable, testable, and deployable with Docker.

## Layout

```text
orfwear/
├── apps/
│   ├── web/          # Next.js PWA (orfwear.ir)
│   └── api/          # Django + Django Ninja (api.orfwear.ir)
├── packages/
│   └── contracts/    # OpenAPI specs + generated TS client
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

- Web: http://localhost:3000
- API docs: http://localhost:8000/api/docs
- Admin: http://localhost:8000/admin

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

See [docs/architecture.md](docs/architecture.md).
