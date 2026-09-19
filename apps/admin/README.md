# ORF Admin

Next.js staff panel for ORF Wear (`admin.orfwear.ir`).

Shares design tokens and Vazirmatn (temporary) with `apps/web`. Desktop sidebar + mobile drawer. Phase 1 modules talk to Django Ninja staff API under `/api/v1/admin/*`.

## Run (port 3001)

```bash
cd apps/admin
cp .env.example .env.local
/opt/homebrew/bin/npm install
/opt/homebrew/bin/npm run dev
```

Open http://localhost:3001

API must be on http://localhost:8001 (see `apps/api`).

## Login / verify

1. Ensure API is running: `cd apps/api && . .venv/bin/activate && python manage.py runserver 0.0.0.0:8001`
2. Open http://localhost:3001/login
3. Local DEBUG bootstrap credentials:
   - email: `staff@orfwear.ir`
   - password: `orfwear`
   - First successful login **creates** this staff user when the DB has none.
4. Panel sets cookie `orf_admin_session` (display + bearer token). API calls send `Authorization: Bearer <token>`.

Smoke without UI:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/v1/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"staff@orfwear.ir","password":"orfwear"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

curl -s http://127.0.0.1:8001/api/v1/admin/dashboard/stats -H "Authorization: Bearer $TOKEN"
curl -s http://127.0.0.1:8001/api/v1/admin/catalog/products -H "Authorization: Bearer $TOKEN"
```

## Env

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8001/api/v1` |

API CORS must include `http://localhost:3001` (`DJANGO_CORS_ALLOWED_ORIGINS` in `apps/api/.env`).

## Live modules

| Page | Behavior |
|------|----------|
| `/` | Dashboard counts |
| `/catalog/products` | List/create/update + variants |
| `/catalog/categories` | List/create |
| `/catalog/collections` | List/create/toggle publish |
| `/inventory` | List + adjust ±1/±10 |
| `/orders`, `/orders/[id]` | List/detail/status + staff notes |
| `/marketing/banners` | CRUD |
| `/customers`, `/payments` | Lists |
| `/shipping/methods` | List/create/toggle |
| `/media` | List + URL upload stub |
| `/content/pages` | List/edit body |
| `/settings` | Read/update store settings stub |

## Structure

- `src/app` — App Router pages
- `src/features` — TanStack Query + RHF module views
- `src/lib/api` — typed admin client (Bearer from session cookie)
- `src/lib/auth` — staff session cookie helpers
