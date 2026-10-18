# Devpost submission copy (paste-ready)

Use this text on [Amazon Alexa+ Devpost](https://amazonappdev2026.devpost.com/). Hosted demo: https://geospatial-quality-explorer.vercel.app. Do **not** claim official Alexa+, MCP, or Agent Skill certification.

---

## Project name

Geospatial Quality Explorer — Alexa+ simulation

## Tagline (one line)

Talk through a vector quality review: deterministic GIS findings, cited in every reply, exportable to QGIS.

## Inspiration

GIS teams still validate delivery polygons one file at a time in desktop tools. The result is hard to audit: which file hash, which ruleset version, and which feature produced each issue? We wanted a conversational path that **feels** like asking Alexa for help, while keeping geometry judgment entirely in a deterministic engine—never in a language model.

The Amazon Alexa+ hackathon pushed us to explore voice-first GIS review. We chose an explicitly labeled **web simulation** so judges can try the flow in a browser without Alexa developer accounts, skill certification, or extra hardware—while reusing our existing TypeScript validator, map viewer, and QGIS export ([ADR 001](./adr-001-alexa-simulation.md)).

## What it does

Geospatial Quality Explorer runs a fixed ruleset (`vector-core`) over GeoJSON and records every finding with provenance (source hash, declared CRS, license, ruleset version). The **Alexa+ simulation** adds a conversational panel on top of that core:

1. **Validate** one of the bundled catalog fixtures, such as `portfolio` (synthetic CC0) or `ne-admin0-westeurope` (Natural Earth 1:110m). The simulation works only on the reviewed fixture catalog; uploading your own GeoJSON is part of the local browser review, not the hosted simulation.
2. **List** prioritized findings on the map and in cards—each with `findingId`, `ruleId`, and `featureId`.
3. **Explain** the next finding using text from the deterministic core, not model invention.
4. **Export** a QGIS bundle and download it as one zip (`findings.qgs`, `findings.qml`, `findings.geojson`, `run-metadata.json`) that opens directly in QGIS 3.

The UI shows persistent badges: *Simulation of Alexa+ — not an Amazon product*, and whether replies use a **deterministic mock** or a **live LLM**. The model orchestrates tool calls; it does **not** judge geometry or mutate source data. Out-of-scope requests (for example “repair this polygon”) are refused.

**Try it:** https://geospatial-quality-explorer.vercel.app or clone the public MIT repo and follow the [two-minute quick start](../../README.md#quick-start-2-minutes-no-database-no-api-key) with `?sim=alexa`.

## How we built it

- **Deterministic core:** TypeScript validation in `packages/quality`—same rules and limits as the CLI and loopback API.
- **Tool boundary:** `packages/alexa-tools` exposes five typed tools (`list_fixtures`, `run_validation`, `list_findings`, `explain_finding`, `export_qgis`) with bounded in-memory sessions ([tool contracts](./tool-contracts.md)).
- **Persona layer:** OpenAI-compatible chat completions via **NaN** (`qwen3.6` by default). The API key lives only in server-side config (`NAN_API_KEY` on Vercel or the local API): it is never bundled into the browser, never placed in the model context, and provider error bodies are not logged or returned. If the model fails, the chat answers a generic 502 instead.
- **Web UI:** React + MapLibre in `apps/web`; speech-capable input for demo video; simulation labeling in copy and layout.
- **Hosted demo:** Vercel static web (`VITE_APP_MODE=alexa-only`) plus a serverless handler for `/api/v1/alexa-sim/*`, bundling catalog fixtures (synthetic CC0 and Natural Earth samples) for judges without PostGIS.

We rejected MCP Streamable HTTP and Amazon Agent Skill for this window: they need hosted transport proof and certification paths we could not finish while keeping quality gates green on the existing stack ([ADR 001](./adr-001-alexa-simulation.md)).

## Challenges we ran into

1. **Loopback-only API vs public demo.** The original API refused non-loopback clients. Wiring Alexa sim routes for Vercel required routing `/api/v1/alexa-sim/*` before the loopback guard and adding Alexa-specific CORS—documented in the [friction log](./friction-log.md).
2. **Configuration clarity.** Hackathon briefs used `NAN_*` env vars while early ADR text used `ALEXA_SIM_LLM_*`. Missing keys correctly fall back to the deterministic mock (good for CI), but before we added a *Model: live LLM / deterministic mock* badge it was easy to think the live model was broken when only the prefix was wrong.
3. **Ephemeral sessions on serverless.** Validation runs live in function memory with TTL and cold-start loss; the demo script and docs tell users to restart if a `runId` disappears.
4. **Latency with a live model.** Early runs of `qwen3.6` exceeded our 45 s budget on Explain and Export. We traced likely causes in our own prompts—tool results carried every geometry and the whole QGIS bundle back to the model, and a bare "next finding" forced an extra listing round—so the model now receives compact tool results (ids, rules, explanations; no geometry or file contents) plus the session's current run and finding order, while the browser still gets the full data. Each model round logs its duration, so we can confirm the effect on the live provider rather than assume it.
5. **Trust boundaries.** We enforced citation of tool output, refusal without data, and no geometry mutation in prompts, contracts, and tests—so the LLM cannot become a silent geometry oracle.

## Accomplishments that we're proud of

- One deterministic core powers CLI, browser review, and the simulated Alexa dialogue.
- Every quality claim in the demo can be traced to `findingId` / `ruleId` / `featureId` from tools.
- Judges can run the full validate → list → explain → export path with **no database** and **no API key** (mock mode), or flip to live `qwen3.6` when keys are configured.
- Open source (MIT), synthetic CC0 fixtures plus Natural Earth public-domain samples, no secrets in the repository.

## What we learned

- A **simulation** with clear labeling is faster to ship and easier for judges to reproduce than a full Alexa skill—while still demonstrating conversational GIS workflows.
- Tool-first design (strict schemas, bounded sessions, explicit error codes) keeps LLM behavior auditable for spatial data.
- Splitting “local loopback API” from “public sim API” early would reduce middleware ordering surprises.

## What's next for Geospatial Quality Explorer

- Optional durable session store for hosted demos (Redis or similar) without weakening bounded limits.
- Explore MCP or Agent Skill routes once transport and certification paths are scoped as their own tickets.
- Deeper QGIS and browser parity for stewards who mix conversational and map-first review.

## Built with

- TypeScript, Node.js 22/24, pnpm workspaces
- React, MapLibre GL JS, Vite
- PostGIS (full browser review path; not required for Alexa simulation demo)
- QGIS 3 (desktop review of exported projects)
- NaN OpenAI-compatible API (`qwen3.6`) for the live persona layer
- Vercel (static hosting + serverless chat handler)

## Links

- **Public repository:** (GitHub URL — confirm at submit time)
- **Demo video:** (YouTube/Vimeo URL — add after upload)
- **Live demo:** https://geospatial-quality-explorer.vercel.app

## Open Source mini-challenge

Repository is public under **MIT**. Synthetic fixtures are **CC0 1.0**; Natural Earth samples follow Natural Earth public-domain terms (`NaturalEarth-public-domain`). Third-party notices are in `THIRD_PARTY_NOTICES.md`.
