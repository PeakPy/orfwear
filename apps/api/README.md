# ORF API

Django + Django Ninja backend for ORF Wear.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/local.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Apps

Domain modules live under `apps/` as bounded contexts.
HTTP routers live in each app's `api/` package and are mounted from `config/api.py`.

## Docker

Built from repo root:

```bash
docker build -f ../../deploy/docker/api.Dockerfile -t orfwear-api .
```
