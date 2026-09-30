# 01: Land the `dev:api` runtime fix so the local demo API starts

## Parent and source

- Parent task: [stabilize-mvp-qgis](../index.md)
- Linear: [MAC-51](https://linear.app/maciker/issue/MAC-51) (parent [MAC-50](https://linear.app/maciker/issue/MAC-50))
- Decision: [ADR 0004](../../../../../docs/adr/0004-post-mvp-stabilization.md)
- Existing PR: [#16](https://github.com/Maciker/geospatial-quality-explorer/pull/16) (`cursor/fix-dev-api-pg-runtime-c146`)

## What this slice delivers

A developer following [`docs/demo.md`](../../../../../docs/demo.md) can run `pnpm dev:api` without the `Cannot find package 'pg'` failure from the compiled `dist/` tree.

## Acceptance criteria

- [x] `dev:api` runs the API from TypeScript source via `tsx` (same pattern as `gis` and the Playwright webServer), or an equivalent fix that resolves `pg` under pnpm isolation.
- [x] `GET /health` returns HTTP 200 after start.
- [x] The change is on `main` (merge PR #16 or land an equivalent one-line fix).
- [x] No new application logic or dependency graph changes beyond the start script.

## Verification

```sh
pnpm dev:api
# in another shell:
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/health
```

Also run `pnpm quality:fast` on the branch that lands the fix.

## Blocked by

None.

## Scope and exclusions

- In scope: root `package.json` `dev:api` script (or the minimal equivalent already proposed in PR #16).
- Out of scope: changing persistence, bundling `pg` into a fat server build, auth, hosted deploy, or browser UI work.

## Status and evidence

done — landed on `main` via PR #18 at `826dfbf` (Linear MAC-51).
