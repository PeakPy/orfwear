# Separation / Docker independence

## Today (monorepo)

```bash
# both
make up

# or independently later even inside this repo:
docker build -f deploy/docker/api.Dockerfile -t orfwear-api apps/api
docker build -f deploy/docker/web.Dockerfile -t orfwear-web apps/web
```

## Tomorrow (two repos)

| Move | Becomes |
|------|---------|
| `apps/api` | `orfwear-api` |
| `apps/web` | `orfwear-web` |
| `packages/contracts` | shared package or submodule |
| `deploy/compose` | optional infra repo |

No shared runtime imports exist between web and api, so the split is mostly `git mv` + CI URL updates.
