# Plan: hackathon-delivery-fixes (PR #26)

## Objective

Make the Devpost delivery pack accurate and make the demo it scripts work end to end, before the 2026-10-23 submission.

## Approval

Approved by the repository owner on 2026-10-15 ("arregla todo en esta rama PR") after the review of PR #26.

## Steps (tests first for behavior; one commit per slice)

1. LLM failures: the chat handler answers 502 `llm_unavailable` with a generic message, never the provider body; the local API route never lets a rejection crash the process. Provider error messages keep only the HTTP status.
2. QGIS export from the simulation: one zip whose entries match the CLI bundle names (`findings.qgs`, `findings.geojson`, `findings.qml`, `run-metadata.json`) so the project's `./findings.geojson` datasource resolves; dependency-free stored zip with CRC-32.
3. Docs: correct tool names, the upload claim and Feedback 1 in the Devpost pack; video shots 7–8 and `docs/demo.md` describe the zip; align the ADR Devpost URL; add `VITE_*` build variables to `.env.example`; Vercel key-handling checklist.
4. Workflow hygiene: restore LF line endings in the nine `.ai/skills` references (content unchanged) and regenerate adapters.

## Verification

`pnpm quality:full` with PostGIS, `pnpm test:e2e`, `pnpm quality:stabilization`, unzip integrity check, cross-model QA and `pnpm prepr:gate` on the final head, then `pnpm pr:review`.
