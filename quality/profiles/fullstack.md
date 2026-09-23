# Fullstack Profile

Combines core, React, and browser QA profiles.

Use this profile for repos that include application code, UI flows, E2E tests, and browser-verified acceptance criteria.

## Includes

- Core profile
- React profile
- Browser QA profile

## Typical command flow

```bash
pnpm quality:full
pnpm qa:prepare -- --base origin/main --head HEAD
# run cross-model QA
pnpm qa:gate
```

Optional manual/browser checks:

```text
/frontend-review <scope>
/functional-qa <prd-or-flow>
/ux-review <flow-or-screen>
```

## Optional OpenSpec Extension

For teams that track changes with durable proposal/design/spec/task artifacts, add the `openspec` profile on top of fullstack.
