# ADR 001: Alexa+ hackathon route — web simulation

Status: accepted (2026-10-12)

Tracker: [MAC-229](https://linear.app/maciker/issue/MAC-229), gate [MAC-230](https://linear.app/maciker/issue/MAC-230), implementation [MAC-231](https://linear.app/maciker/issue/MAC-231), delivery [MAC-232](https://linear.app/maciker/issue/MAC-232), friction log [MAC-371](https://linear.app/maciker/issue/MAC-371).

Hackathon: [Amazon Alexa+ on Devpost](https://alexa.devpost.com/) — submission deadline **2026-10-23 12:00 PT** (21:00 Madrid).

Repository baseline for this ADR: commit `b899c81cfd5f4b25881aee56cf019c6e37b3f7d8` (`Merge pull request #21 from Maciker/feat/post-pr-review-workflow`).

## Context

Geospatial Quality Explorer already delivers a deterministic validation core (`packages/quality`), a CLI (`apps/cli`), a loopback API and browser viewer (`apps/api`, `apps/web`), and QGIS export via `buildQgisBundle`. The Alexa+ hackathon requires a conversational GIS review path that reuses that stack without treating an LLM as a geometry or accuracy oracle (see `docs/project-spec.md`).

Three integration routes were in scope for [MAC-230](https://linear.app/maciker/issue/MAC-230):

1. MCP Streamable HTTP (Alexa+ tool transport),
2. Amazon Agent Skill,
3. An explicitly labeled **web simulation** of Alexa+.

## Decision

**Adopt route 3: web simulation.** Reject MCP and Agent Skill for this submission window.

| Route | Outcome | Rationale |
| --- | --- | --- |
| MCP Streamable HTTP | Rejected | Requires a hosted MCP adapter, session semantics, and judge-facing transport proof within the hackathon window; the repo’s API is loopback-only and in-memory ([MAC-230](https://linear.app/maciker/issue/MAC-230)). |
| Agent Skill | Rejected | Needs Alexa developer account, skill certification path, and voice hardware or simulator coupling; does not reuse the existing web viewer without a parallel stack ([MAC-230](https://linear.app/maciker/issue/MAC-230)). |
| Web simulation | **Selected** | Reuses the deterministic core through documented tool contracts; demo and video can show voice-like dialogue in the browser with a visible **simulation** label ([MAC-231](https://linear.app/maciker/issue/MAC-231)). |

This is **not** an official Alexa integration. UI copy, demo video, and Devpost materials must state that the experience is a **simulation** ([MAC-231](https://linear.app/maciker/issue/MAC-231)).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Product surface | Web UI (extend `apps/web`) | Conversational panel + existing findings map/import flow. |
| “Alexa” persona | LLM via **OpenAI-compatible** chat completions | Provider: **NaN** (`https://api.nan.builders/v1`). Default model: `qwen3.6`. Configure with environment variables only; **never commit API keys** ([MAC-231](https://linear.app/maciker/issue/MAC-231)). |
| Ground truth | Deterministic validation core | Tool handlers call `packages/quality` (validate, page/prioritize findings, QGIS bundle). Same ruleset and limits as CLI/API. |
| Tool boundary | `packages/alexa-tools` | Typed contracts in `docs/hackathon/tool-contracts.md`; bounded in-memory sessions keyed by `sessionId`, runs keyed by `runId`. |
| Hosting target | **Vercel** (demo URL for judges) | Fits static web + serverless API routes; see hosting gaps below. |

Suggested environment variables (names may be prefixed in implementation):

- `ALEXA_SIM_LLM_BASE_URL` — default `https://api.nan.builders/v1`
- `ALEXA_SIM_LLM_MODEL` — default `qwen3.6`
- `ALEXA_SIM_LLM_API_KEY` — required in deployed demo; unset locally disables live LLM (simulation UI still testable with scripted tool traces)

## Behavioral rules (non-negotiable)

Aligned with [MAC-231](https://linear.app/maciker/issue/MAC-231) and `docs/project-spec.md`:

1. **Citation** — Every assistant claim about a dataset issue must cite `findingId`, `ruleId`, and/or `featureId` returned from tools. No uncited assertions about validation results.
2. **Refusal** — When tools return no data, an unknown id, or an out-of-scope request, the assistant must refuse rather than invent findings or geometries.
3. **No geometry mutation** — AI must not edit, repair, or replace source GeoJSON. Only deterministic validators produce findings; `suggestedAction` text is read-only guidance from the core.
4. **Simulation disclosure** — Persistent UI badge and demo video narration must say the experience is an Alexa+ **simulation**, not a certified Alexa skill.

## Hosting: current server vs Vercel

Today’s `apps/api` server is optimized for **local demo**, not serverless hosting:

| Property | Current behavior | Change needed for Vercel |
| --- | --- | --- |
| Bind address | Loopback-only (`assertLoopbackHost`, remote clients get 403 on `/api/*`) | Public HTTPS handler without loopback guard for deployed routes, or separate `apps/api` entry for serverless. |
| Persistence | `InMemoryValidationRunRepository` — runs lost on cold start | Bounded session store (see `packages/alexa-tools`) with TTL; optional external store later; document ephemeral demo limits. |
| CORS | Allow-list `localhost` / `127.0.0.1` Vite ports only | Add deployed web origin(s) to CORS policy. |
| Import jobs | In-process job map on one Node process | Map job polling to synchronous validation or durable queue if multi-instance. |

Document expected demo limits (session TTL, max runs, max payload) in `docs/hackathon/tool-contracts.md`.

## Open Source mini-challenge

The repository is **private during early hackathon work** and will be **made public** before judge access (target per [MAC-232](https://linear.app/maciker/issue/MAC-232): ~2026-10-22). License and README delta will be updated in the delivery ticket; this ADR only records the intent.

## Consequences

- Implement conversational UI and LLM tool-calling against `packages/alexa-tools` ([MAC-231](https://linear.app/maciker/issue/MAC-231)).
- Keep existing quality gates green; no new GIS rules in hackathon scope.
- Prepare friction log from `docs/hackathon/friction-log.md` for Devpost Product Feedback ([MAC-371](https://linear.app/maciker/issue/MAC-371)).
- Do **not** claim official Alexa+, MCP, or Agent Skill certification in README or Devpost copy.

## References

- Tool contracts: `docs/hackathon/tool-contracts.md`
- Friction log template: `docs/hackathon/friction-log.md`
- Vector finding contract: `docs/contracts.md`
- API loopback/CORS: `apps/api/src/server.ts`, `apps/api/src/openapi.ts`
