# Workflow synchronization — 2026-10-14

Source: `Maciker/agent-workflow-code-ts@9fee87341827d8ad865f514f81b922a7e792ca23`.
Destination: `Maciker/geospatial-quality-explorer`; canonical integration: `.ai`.

## Approval

Status: approved
Approved by: Iker Macaya
Scope: user's explicit request on 2026-10-14 to propagate the updated workflow to every existing consumer. Merge and deployment remain separate.

## Plan

- Update applicable canonical workflow procedures, shared skill updates and QA semantics.
- Preserve project-specific instructions, package manager, product architecture, local review protections and quality baselines.
- Regenerate supported adapters using the destination's own generator/export process.
- Run available deterministic checks and record their actual results. Independent QA and exact-SHA gates remain required; unavailable evidence is pending, never fabricated.

No product features, baseline growth, credentials, deployments or auto-merge are part of this change.

## Validation

Vendor/Codex checks and focused workflow tests pass. Full quality:full reached application tests: PostGIS is unavailable at 127.0.0.1:5432 and the existing CLI process test fails in this environment. The gate was not weakened.

## Review and remaining gates

A read-only reviewer requested as `openai:gpt-6-astra` reviewed the technical delta and exercised QA regressions. The implementing session exposes only the GPT-6 family; its deployment variant is not exposed. This is a technical review, not attested exact-model cross-model approval. No model evidence or pre-PR pass for these production changes is fabricated. Exact-model QA/pre-PR and post-PR checks remain pending; do not merge or enable auto-merge.
