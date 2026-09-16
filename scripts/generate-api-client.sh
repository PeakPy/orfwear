#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="$ROOT_DIR/packages/contracts/openapi/orfwear-v1.json"
OUT_DIR="$ROOT_DIR/packages/contracts/typescript/generated"

if [[ ! -f "$SPEC" ]]; then
  echo "OpenAPI spec missing. Run: make openapi" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

if command -v npx >/dev/null 2>&1; then
  npx --yes openapi-typescript "$SPEC" -o "$OUT_DIR/schema.ts"
  echo "Generated $OUT_DIR/schema.ts"
else
  echo "npx not found; copied placeholder only"
  cat > "$OUT_DIR/schema.ts" <<'EOF'
// Placeholder. Install Node.js and rerun scripts/generate-api-client.sh
export type paths = Record<string, never>;
EOF
fi
