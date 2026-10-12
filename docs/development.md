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

Run `pnpm dev:api` in one terminal and `pnpm dev:web` in another. The API binds to 127.0.0.1:8000; Vite proxies /api to it. Open the URL printed by Vite and add `?run=<run id>` after `pnpm gis validate`.

Persistence uses PostGIS:

```sh
docker compose -f infra/docker-compose.yml up -d db
export GEOSPATIAL_POSTGIS_URL=postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer
pnpm gis migrate
```

`pnpm gis migrate` applies `packages/persistence/migrations`. The Docker init script only enables PostGIS. Credentials are for local development. Do not expose the database or API to a public network. Integration tests use `GEOSPATIAL_POSTGIS_URL` or the same local URL.

`PORT` changes the API port (also update Vite's proxy target when using a different port). No Python environment is needed. The production web build is static and requires a same-origin /api reverse proxy; deployment is outside this foundation.

## Alexa+ simulation (MAC-231)

The labeled Alexa+ web simulation uses deterministic tools from `packages/alexa-tools` and an OpenAI-compatible LLM.

```sh
export ALEXA_SIM_MOCK_LLM=deterministic   # CI and local UI without API keys
# Optional live model (never commit keys):
# export NAN_API_KEY=...
# export NAN_BASE_URL=https://api.nan.builders/v1
# export NAN_MODEL=qwen3.6
pnpm dev:api
pnpm dev:web
```

Open the web app, choose **Alexa+ simulation**, or visit `/?sim=alexa`. Chat posts to `POST /api/v1/alexa-sim/chat`. For Vercel, `vercel.json` rewrites that path to `api/alexa-sim.ts`. Configure deployed origins with `ALEXA_SIM_CORS_ORIGINS` (comma-separated HTTPS origins).
