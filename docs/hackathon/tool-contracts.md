# Alexa+ simulation tool contracts

Normative contract for LLM tool calls into the deterministic GIS core ([MAC-231](https://linear.app/maciker/issue/MAC-231)). TypeScript definitions live in `packages/alexa-tools/src/domain/toolContracts.ts`.

**Principles:** Tools never mutate source geometry. Assistants must cite `findingId`, `ruleId`, and `featureId` from tool output. Missing data yields `refused` or `not_found`, not invented answers.

## Session model

- Clients pass `sessionId` (opaque string, 8–128 chars, `[a-zA-Z0-9_-]+`) on every tool call except the first `list_fixtures`, which may omit it and receive a new id.
- A **session** holds validation **runs** keyed by `runId` (64-char hex digest from the core).
- Storage is **in-memory**, **bounded**, and **TTL-scoped** (defaults in `packages/alexa-tools`). Suitable for Vercel demo with documented cold-start loss ([ADR 001](./adr-001-alexa-simulation.md)).
- **Stateless callers** may start a new session per demo script; **bounded session** callers reuse one `sessionId` across the validate → list → explain → export flow.

## Shared limits

Aligned with `docs/contracts.md` and `DATASET_LIMITS`:

| Limit | Value |
| --- | --- |
| Max upload / fixture read | 1,048,576 bytes |
| Max features | 500 |
| Max findings page | 100 (default 50) |
| Max runs per session | 8 (adapter default) |
| Max concurrent sessions (adapter) | 64 (adapter default) |
| Session TTL | 30 minutes idle (adapter default) |
| Chat request body | 65,536 bytes (`ALEXA_SIM_LIMITS`) |
| Chat messages per request | 40, each at most 4,000 characters, roles `user` and `assistant` only |
| Chat requests per client | 20 per minute per server instance (`ALEXA_SIM_RATE_LIMIT_PER_MINUTE`) |

## What the model sees

The browser receives full tool results. The model receives a compact copy: finding geometries are removed and `export_qgis` file contents are replaced by the file names. On a request that carries a `sessionId`, the server prepends a system message with the session's current `runId`, dataset and up to 20 prioritized `findingId`s (`QualityToolsPort.describeSession`).

## Grounding rules for model replies

- Turns that ask to validate, list, explain or export force the matching tool call (`tool_choice`). If the model still answers without calling `export_qgis` or `list_findings` (for example "please wait"), the server makes that call with the session id.
- Each tool returns a deterministic `voiceAnswer` built from its own output.
- The model's reply is replaced by that `voiceAnswer` when it states quality results without citing tool ids, names any finding, rule or feature id the tools did not return (for example `ID001` or `dup-1`), omits the finding the tool returned on that turn, or only promises work ("please wait") after the tool finished. With no `voiceAnswer` available, the reply is refused instead.

## Response envelope

Success:

```json
{
  "ok": true,
  "sessionId": "abc123",
  "data": { }
}
```

Error:

```json
{
  "ok": false,
  "sessionId": "abc123",
  "error": "not_found",
  "message": "Human-readable reason.",
  "details": { }
}
```

| `error` code | HTTP-style meaning |
| --- | --- |
| `invalid_request` | Bad parameters, unsupported fixture, oversize payload |
| `not_found` | Unknown `runId`, `findingId`, or `fixtureId` |
| `session_expired` | TTL elapsed |
| `session_full` | Run or session cap exceeded |
| `limit_exceeded` | Page size or feature limits exceeded |
| `refused` | Policy refusal (e.g. explain without stored run) |

## Tools

### `list_fixtures`

**Purpose:** Enumerate CC0 reference datasets under `packages/quality/fixtures/vector/` for deterministic demos.

**Input**

| Field | Required | Notes |
| --- | --- | --- |
| `sessionId` | no | If omitted, server mints one |

**Output `data`**

| Field | Type | Notes |
| --- | --- | --- |
| `fixtures` | array | `{ fixtureId, label, license, defaultSourceCrs }` |

Default CRS for fixtures: `EPSG:4326`. License: `CC0-1.0`.

---

### `run_validation`

**Purpose:** Run ruleset `vector-core` 1.1.0 on a catalog fixture. Stores the full `ValidationRun` in the session.

**Input**

| Field | Required | Notes |
| --- | --- | --- |
| `sessionId` | yes | |
| `fixtureId` | yes | Basename without `.geojson` (e.g. `portfolio`) |

**Output `data`**

| Field | Notes |
| --- | --- |
| `runId` | 64-char hex |
| `datasetName` | |
| `sourceHash` | |
| `findingCount` | |
| `status` | `succeeded` or `failed` |
| `limitations` | Stable disclaimer strings from core |

Does not return full findings (use `list_findings`).

---

### `list_findings`

**Purpose:** Return a **prioritized**, paginated slice of findings for a stored run.

**Priority order:** `error` → `warning` → `info`, then feature index, `ruleId`, `findingId` (see `prioritizeFindings` in `packages/alexa-tools`).

**Input**

| Field | Required | Notes |
| --- | --- | --- |
| `sessionId` | yes | |
| `runId` | yes | |
| `limit` | no | 1–100, default 50 |
| `cursor` | no | Opaque cursor from previous page (`nextCursor` is the first finding on the next page) |

**Output `data`**

| Field | Notes |
| --- | --- |
| `runId` | |
| `findings` | `{ findingId, ruleId, severity, featureId, explanation, suggestedAction, geometry }` |
| `nextCursor` | null if last page |

Assistant must quote ids from this payload when describing issues.

---

### `explain_finding`

**Purpose:** Fetch one finding by `findingId` from any run in the session.

**Input**

| Field | Required | Notes |
| --- | --- | --- |
| `sessionId` | yes | |
| `findingId` | yes | Format `{runId}:{featureIndex}:{ruleId}` |

**Output `data`**

| Field | Notes |
| --- | --- |
| `runId` | Run that owns the finding |
| `finding` | Full finding record |

**Errors:** `not_found` if id absent; `refused` if session has no runs yet.

---

### `export_qgis`

**Purpose:** Build the same QGIS bundle as `pnpm gis export qgis` without writing to disk (serverless-safe).

**Input**

| Field | Required | Notes |
| --- | --- | --- |
| `sessionId` | yes | |
| `runId` | yes | |

**Output `data`**

| Field | Notes |
| --- | --- |
| `runId` | |
| `files` | `{ geojson, metadata, project, style }` string contents |
| `limitations` | From run |

## Implementation map

| Tool | Core dependency |
| --- | --- |
| `list_fixtures` | Fixture catalog adapter |
| `run_validation` | `validateDataset`, `PlanarPolygonEngine`, `Sha256Digest` |
| `list_findings` | Stored run + `prioritizeFindings` + cursor paging |
| `explain_finding` | Session scan by `findingId` |
| `export_qgis` | `buildQgisBundle` |

Adapter entry point: `BoundedSessionQualityToolsAdapter` in `packages/alexa-tools`.

## Out of scope for tools

- Remote URLs, file paths from user text, or archive uploads (same as loopback API).
- CRS reprojection or geometry repair.
- LLM-generated findings or severities.
