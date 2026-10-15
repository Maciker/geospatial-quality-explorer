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

Open the web app, choose **Alexa+ simulation**, or visit `/?sim=alexa`. The panel shows whether replies come from the deterministic mock or a live LLM. Chat posts to `POST /api/v1/alexa-sim/chat`; `GET /api/v1/alexa-sim/health` reports `llmMode`. The canonical variable prefix is `NAN_*`; `ALEXA_SIM_LLM_BASE_URL`, `ALEXA_SIM_LLM_MODEL` and `ALEXA_SIM_LLM_API_KEY` remain accepted aliases. See `.env.example`.

Chat requests are bounded: 64 KiB body, 40 messages, 4,000 characters per message, roles `user` and `assistant` only (tool results and the system prompt are produced on the server), and 20 requests per minute per client (`ALEXA_SIM_RATE_LIMIT_PER_MINUTE`). The panel trims older history to stay inside these limits.

Latency: one chat POST must finish within `ALEXA_SIM_TIMEOUT_MS` (default 45 000 ms, capped at 55 000 ms for Vercel `maxDuration` 60 s). Each LLM call uses up to `ALEXA_SIM_ROUND_TIMEOUT_MS` (default 24 000 ms) but never more than half the remaining turn budget (the whole remainder for the last possible call). Once a tool returns `voiceAnswer`, that text is the reply and the model is not called again; if the first call times out on an explicit export or list command, the server runs that tool itself. Thinking is off by default (`ALEXA_SIM_ENABLE_THINKING` / `NAN_ENABLE_THINKING` set to `1` to enable): the client sends `chat_template_kwargs.enable_thinking=false` only to the NaN host (`*.nan.builders`), because strict OpenAI-compatible APIs reject unknown fields; set `ALEXA_SIM_DISABLE_THINKING=1` to send it to another provider that accepts it. Internal reasoning is never shown in chat. The model receives compact tool results (no geometries, no QGIS file contents) and session finding ids on follow-ups. Logs: `alexa-sim: LLM round <ms> ms (HTTP <status>) <step>` with tool names only, never payloads.

### Hosted demo (Vercel)

`vercel.json` builds the web app with `VITE_APP_MODE=alexa-only`, so the hosted page is the simulation alone: the run review screen needs the local PostGIS API, which is not deployed. `/api/v1/alexa-sim/*` is rewritten to the `api/alexa-sim.ts` function, which bundles the CC0 fixtures.

Before sharing the URL:

1. Set `NAN_API_KEY` (and optionally `NAN_MODEL`) in the Vercel project for the **Production** environment only, never in Git and never as a `VITE_*` variable. Preview deployments then run the mock.
2. Keep Vercel's Git fork protection on: with a public repository, a pull request from a fork must not build with your environment variables.
3. Set a spend limit at the LLM provider. The rate limit is per serverless instance and only best-effort, so spend, not disclosure, is the main exposure.
4. Set `ALEXA_SIM_CORS_ORIGINS` only if the web app is served from another origin.
5. Open the URL, check the badge reads **Model: live LLM**, and run the validate → list → explain → export script once.
6. If the key was ever pasted into a chat, screenshot or ticket, rotate it before publishing.

How the key is protected: it is read only on the server, sent only in the `Authorization` header to the provider, never placed in the model context, and never returned to the browser. If the provider fails, the chat answers `502 llm_unavailable` and only the HTTP status is logged, because provider error bodies can echo the key.

Sessions and runs live in function memory and can disappear on a cold start or when traffic hits a different serverless instance. The chat recovers by reopening the client `sessionId` and, when the current message names an allow-listed fixture (for example the portfolio fixture), revalidating that fixture once. If the message does not name a catalog fixture, the assistant asks you to validate again; you can also use **New clean session**. Do not treat browser cards, transcript text, or a remembered `runId` as proof of a completed validation.
