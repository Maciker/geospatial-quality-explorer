# Alexa+ hackathon friction log

Template for [MAC-371](https://linear.app/maciker/issue/MAC-371) (Devpost Product Feedback). Copy one block per incident while building or demoing the simulation. English preferred for submission; Spanish notes are fine in drafts. Paste-ready Devpost text from logged entries lives in [product-feedback.md](./product-feedback.md).

**Product area:** Geospatial Quality Explorer — Alexa+ web simulation (not official Alexa).

---

## Entry template

| Field | Your notes |
| --- | --- |
| **Date (UTC)** | |
| **Task** | What you were trying to accomplish (e.g. “Run validation on portfolio fixture via simulated Alexa”). |
| **Steps** | Numbered reproduction steps. |
| **Expected** | What should have happened. |
| **Actual** | What happened instead. |
| **Severity** | `blocker` / `major` / `minor` / `cosmetic` |
| **Workaround** | How you unblocked yourself, or “none”. |
| **Actionable suggestion** | Concrete fix for Amazon, NaN provider, Vercel, or this repo. |
| **Evidence** | Link, screenshot path, commit, or tool trace id. |

---

## Entry 2026-10-12 — dual env var names for NaN LLM

| Field | Your notes |
| --- | --- |
| **Date (UTC)** | 2026-10-12 |
| **Task** | Wire OpenAI-compatible Alexa persona for local demo |
| **Steps** | 1. Follow ADR `ALEXA_SIM_LLM_*` names. 2. Our internal task brief uses `NAN_*`. 3. Start API without keys. |
| **Expected** | One documented env prefix toggles live LLM vs deterministic mock. |
| **Actual** | ADR and ticket text disagree on prefix; missing key silently falls back to mock, which is good for CI but easy to misread as a broken live model. |
| **Severity** | minor |
| **Workaround** | `readNanLlmConfig()` accepts both prefixes; set `ALEXA_SIM_MOCK_LLM=deterministic` for tests. |
| **Actionable suggestion** | Document a single canonical prefix in delivery README and keep alias support. |
| **Evidence** | MAC-231, `packages/alexa-sim/src/infrastructure/readNanLlmConfig.ts` |

## Entry 2026-10-12 — loopback guard vs public Alexa routes

| Field | Your notes |
| --- | --- |
| **Date (UTC)** | 2026-10-12 |
| **Task** | Expose `/api/v1/alexa-sim/chat` for Vercel while keeping legacy loopback API |
| **Steps** | 1. Add alexa route to `apps/api`. 2. Hit route through Vite proxy. 3. Compare with `/api/v1/imports` guard. |
| **Expected** | Alexa sim works behind proxy and on serverless without loopback-only 403. |
| **Actual** | Global loopback middleware blocked new routes until alexa paths were routed before the guard; global OPTIONS also skipped alexa-specific CORS headers. |
| **Severity** | major |
| **Workaround** | Route `/api/v1/alexa-sim/*` before loopback check; dedicated CORS via `ALEXA_SIM_CORS_ORIGINS`. |
| **Actionable suggestion** | Split “demo loopback API” and “public sim API” into named routers in `apps/api` to avoid ordering bugs. |
| **Evidence** | MAC-231, `apps/api/src/server.ts` |

## Entry 2026-10-18 — WebGL startup blanks the simulation

| Field | Observation |
| --- | --- |
| Date (UTC) | 2026-10-18, 10:09:39 |
| Task | Open the production simulation for final review. |
| Steps | Open the demo in a Chrome review environment without an available WebGL context; reload once. |
| Expected | Chat, findings and export remain available even if the map cannot start. |
| Actual | Entire app was blank. Console: `webglcontextcreationerror`, `Failed to initialize WebGL`, `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`. |
| Severity | blocker in that environment; not a claim that all browsers fail. |
| Workaround | No in-app workaround in the observed build. A compatible browser is a possible workaround, not verified by this incident. |
| Actionable suggestion | Catch map startup failure, keep the list/conversation/export, and test the complete review without WebGL. |
| Evidence | MAC-460; production asset `index-C5RNyITz.js`; `apps/web/src/findings/FindingsMap.tsx`. |
| Status | Source correction and browser regression in this change; final production smoke pending. |

---

## Running totals (optional)

| Severity | Count |
| --- | --- |
| blocker | 1 |
| major | 1 |
| minor | 1 |
| cosmetic | 0 |
