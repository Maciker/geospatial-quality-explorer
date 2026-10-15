# Product Feedback (Devpost draft)

**Ticket:** [MAC-371](https://linear.app/maciker/issue/MAC-371)  
**Source:** Only incidents documented in [friction-log.md](./friction-log.md) and hosting notes in [ADR 001](./adr-001-alexa-simulation.md). Do not paste speculative issues.

Copy the sections below into Devpost **Product Feedback** when submitting. Adjust wording if new friction log entries are added before 2026-10-22.

---

## Summary

We built a **labeled web simulation** of Alexa+ for GIS quality review, using an OpenAI-compatible model (NaN `qwen3.6`) behind server-side tool calls into a deterministic validator. Two friction points stood out while wiring local development and Vercel hosting; both were resolved in-repo but are worth surfacing for platform and hackathon documentation.

---

## Feedback 1 — Align environment variable naming in hackathon materials

**Product area:** NaN / OpenAI-compatible LLM setup for Alexa+ style demos.

**What happened:** Early internal ADR text documented `ALEXA_SIM_LLM_*` variables while the hackathon brief and NaN docs use `NAN_*`. Starting the API without keys correctly falls back to a deterministic mock, but when developers set only one prefix, the UI still shows the mock badge and it looks like the live model failed.

**Impact:** Minor time lost during integration; no blocker once aliases were implemented.

**Suggestion:** Publish one canonical env block in Alexa+ hackathon starter docs (for example `NAN_API_KEY`, `NAN_BASE_URL`, `NAN_MODEL`) and mention that samples may accept prefixed aliases. Call out that missing keys intentionally enable mock mode for CI and offline demos.

**Evidence:** Friction log entry 2026-10-12 — dual env var names; `packages/alexa-sim/src/infrastructure/readNanLlmConfig.ts`; delivery README and [development.md](../development.md#alexa-simulation-mac-231).

---

## Feedback 2 — Loopback-first API patterns vs serverless public routes

**Product area:** Hosting conversational demos on Vercel (or similar) while keeping a secure local API.

**What happened:** Our existing API middleware rejected non-loopback clients on `/api/*`. Adding `/api/v1/alexa-sim/chat` for judges required registering Alexa routes **before** the loopback guard and supplying Alexa-specific CORS via `ALEXA_SIM_CORS_ORIGINS`. Global OPTIONS handling initially skipped those headers.

**Impact:** Major integration surprise during MAC-231; fixed by explicit route ordering and dedicated CORS config.

**Suggestion:** In Alexa+ or Vercel sample repos, show a **split router** pattern: `local-only` resources vs `demo-public` resources, with a checklist for CORS and middleware order. Document that serverless functions do not share in-process state with a loopback Node server.

**Evidence:** Friction log entry 2026-10-12 — loopback guard vs public Alexa routes; `apps/api/src/server.ts`; [ADR 001 — Hosting](./adr-001-alexa-simulation.md#hosting-current-server-vs-vercel).

---

## Positive note (optional)

Tool-first contracts with bounded sessions, explicit error codes (`refused`, `not_found`, `session_expired`), and rate limits mapped cleanly onto OpenAI-style function calling. That made it feasible to enforce “cite finding ids” and “no geometry mutation” in tests as well as prompts.

---

## Not included here

No entries beyond the friction log above. Add new blocks to `friction-log.md` first, then mirror them here before submit.
