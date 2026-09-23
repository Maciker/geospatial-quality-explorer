# Local development

Use Node.js 22 or 24, Corepack and pinned pnpm 10.17.1. From the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
pnpm quality:full
pnpm quality:stabilization
```

For environments with a different global pnpm, use `corepack pnpm` or enable Corepack shims first. Esbuild is the sole allowlisted dependency build script.

Run `pnpm dev:api` in one terminal and `pnpm dev:web` in another. The API binds to 127.0.0.1:8000; Vite proxies /api to it. Open the URL printed by Vite. /health identifies the API; /api/v1/findings deliberately returns an empty FeatureCollection until persistence/API tickets land. No database is required for these two scaffold endpoints.

Optional future persistence setup: `docker compose -f infra/docker-compose.yml up -d db`. This existing schema is a draft, not an applied migration system. The credentials are local development only. Versioned migrations and integration tests belong to the persistence ticket. Do not expose the database or API to the public network.

`PORT` changes the API port (also update Vite's proxy target when using a different port). No Python environment is needed. The production web build is static and requires a same-origin /api reverse proxy; deployment is outside this foundation.
