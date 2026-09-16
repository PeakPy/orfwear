#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cp -n .env.example .env || true
cp -n apps/web/.env.example apps/web/.env.local || true
cp -n apps/api/.env.example apps/api/.env || true

echo "Bootstrapping web..."
(cd apps/web && npm install)

echo "Bootstrapping api..."
(cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements/local.txt)

echo "Done. Next: make up   or   make api / make web"
