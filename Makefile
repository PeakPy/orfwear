.PHONY: bootstrap up down logs web api migrate makemigrations shell test-web test-api lint fmt openapi generate-client clean

COMPOSE := docker compose -f deploy/compose/docker-compose.yml -f deploy/compose/docker-compose.dev.yml --env-file .env

bootstrap:
	cp -n .env.example .env || true
	cp -n apps/web/.env.example apps/web/.env.local || true
	cp -n apps/api/.env.example apps/api/.env || true
	cd apps/web && npm install
	cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements/local.txt

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

web:
	cd apps/web && npm run dev

api:
	cd apps/api && . .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

migrate:
	cd apps/api && . .venv/bin/activate && python manage.py migrate

makemigrations:
	cd apps/api && . .venv/bin/activate && python manage.py makemigrations

shell:
	cd apps/api && . .venv/bin/activate && python manage.py shell

test-web:
	cd apps/web && npm test

test-api:
	cd apps/api && . .venv/bin/activate && pytest

lint:
	cd apps/web && npm run lint
	cd apps/api && . .venv/bin/activate && ruff check .

fmt:
	cd apps/web && npm run format
	cd apps/api && . .venv/bin/activate && ruff format .

openapi:
	cd apps/api && . .venv/bin/activate && python manage.py export_openapi

generate-client:
	./scripts/generate-api-client.sh

clean:
	$(COMPOSE) down -v --remove-orphans
	rm -rf apps/web/.next apps/api/.venv apps/api/**/__pycache__
