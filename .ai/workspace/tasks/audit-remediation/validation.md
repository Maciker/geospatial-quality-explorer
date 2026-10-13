# Validation: audit-remediation

Run on 2026-10-13 against a local PostGIS 16 / PostGIS 3.4. Docker Hub was unreachable from the agent sandbox, so PostGIS was installed from Ubuntu packages with the same database, role and URL as `infra/docker-compose.yml`.

| Check | Result |
| --- | --- |
| `pnpm doctor && pnpm build` | passed |
| `pnpm quality:full` (typecheck, lint, 93 Vitest tests incl. PostGIS integration, depcruise, knip, jscpd, ratchet) | passed |
| `pnpm test:e2e` (4 Playwright journeys) | passed, using the preinstalled Chromium 1194 through a temporary config with `launchOptions.executablePath` |
| `pnpm quality:stabilization` | passed (vendor, Codex, dogfood) |
| `git diff --exit-code` after `pnpm ai:sync` | no drift |
| README CLI path | `validate` exit 2 with `vector-core@1.1.0`; `export qgis --input` wrote the 4-file bundle |
| Alexa script (validate → list → explain next → export QGIS) through the HTTP handler with the mock | all four steps answered, `llmMode: mock`, QGIS bundle returned |

## Not verified here

- Vercel deployment (`vercel.json` function bundling, rewrites, cold starts): owner-owned, needs a Vercel project.
- Live NaN LLM: needs `NAN_API_KEY`.
- Desktop QGIS visual open of `findings.qgs`.
- Cross-model QA (`qa:prepare` + `qa-cross-model` + `prepr:gate`): required by AGENTS.md before a PR is opened; no PR was opened.

## Left for the owner

- Adding a `gis-data-integrity` skill and scoping the skill list in `AGENTS.md`: writing new agent instructions was blocked by the agent's permission policy, so the owner should decide and author it.
