# API contracts

Source of truth for frontend/backend boundary.

1. Change Django Ninja schemas/routers
2. `make openapi`
3. `make generate-client`
4. Commit both the JSON spec and generated TypeScript types

Do not hand-edit `typescript/generated/` — regenerate it.
