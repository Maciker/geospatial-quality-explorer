# Plan: audit-remediation

## Objective

Close the findings of the 2026-10-13 read-only audit before the Alexa+ hackathon deadline (2026-10-23) without adding new GIS products or formats.

## Approval

The repository owner asked to "implement everything necessary" from the audit action plan on 2026-10-13. That request is the approval for this scope.

## Steps (one commit per completed slice; tests first for behavior)

1. Geometry validity (Q1): detect non-proper self-intersections (vertex touch, collinear spike), zero-area rings, overlapping holes and overlapping MultiPolygon parts. Bump `planar-polygon-engine` to 1.1.0 and ruleset `vector-core` to 1.1.0 because findings change for the same input.
2. WGS84 range (Q9): reject positions outside [-180, 180] x [-90, 90] when the declared CRS is EPSG:4326.
3. Import hash (Q8): the API accepts `geojson` as the original text and hashes those exact bytes; the browser sends the file text. Object payloads keep working.
4. CLI arguments (Q11): reject unknown positional arguments and unknown commands instead of ignoring them.
5. Alexa simulation hardening (Q2, Q3): body size limit, message count/length caps, only `user`/`assistant` text from clients, best-effort per-client rate limit.
6. LLM mode disclosure (Q7): responses and health report `llmMode: "mock" | "live"`; the panel shows it.
7. Hosted demo (Q4): Vercel build sets an Alexa-only web mode; the function bundle includes the fixtures.
8. Configuration and docs (Q5, Q6, Q10): `.env.example`, judge-facing README, limitations, contracts, demo wording.
9. Workflow (W1-W3, W5): sync `.ai/` with upstream `agent-workflow-code-ts` HEAD, fix provenance, add a GIS data-integrity skill, scope skills in AGENTS.md, update roadmap; regenerate vendor adapters.

## Verification

- `pnpm quality:full` with a local PostGIS, `pnpm test:e2e`, `pnpm quality:stabilization`.
- Vercel deployment cannot be exercised from this environment; record it as owner-owned.

## Out of scope

- New rules (attributes, topology between features), new formats, MCP or Agent Skill routes.
- Deleting owner-integrated design skills.
