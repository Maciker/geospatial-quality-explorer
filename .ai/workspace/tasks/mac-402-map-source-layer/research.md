# Task Research: MAC-402

See agent research handoff (2026-10-15). Summary:

- FindingsMap remounts on feature serialize; findings-only; flat background; no selection highlight.
- Alexa HTTP is health+chat only; Vercel handler collapses all GET→health.
- Fixtures exist under `packages/quality/fixtures/vector/` (MAC-401) but are not browser-served.
- Explain UX is “next”; Feature.id uses business featureId (ESP collision).
- Trust boundary strips geometry for LLM; keep source layer off the model path.
