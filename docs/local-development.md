# Local development

## Prerequisites

- Docker + Docker Compose
- Node.js 22+
- **Python 3.13+** (API; Docker images use 3.13)
- Make

## First run (Docker)

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
make up
```

Services:

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/api/docs |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

## Hybrid run (recommended while coding UI)

```bash
# infra only
docker compose -f deploy/compose/docker-compose.yml up postgres redis -d

# api
cd apps/api && python -m venv .venv && source .venv/bin/activate
pip install -r requirements/local.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# web (other terminal)
cd apps/web && npm install && npm run dev
```

## Codegen

After API schema changes:

```bash
make openapi
make generate-client
```

## Conventions

- Never commit `.env` files
- Prefer feature folders over dumping everything into `components/`
- Add tests with every non-trivial service/use-case change
