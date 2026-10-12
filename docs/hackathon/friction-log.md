# Alexa+ hackathon friction log

Template for [MAC-371](https://linear.app/maciker/issue/MAC-371) (Devpost Product Feedback). Copy one block per incident while building or demoing the simulation. English preferred for submission; Spanish notes are fine in drafts.

**Product area:** Geospatial Quality Explorer — Alexa+ web simulation (not official Alexa).

---

## Entry template

| Field | Your notes |
| --- | --- |
| **Date (UTC)** | |
| **Task** | What you were trying to accomplish (e.g. “Run validation on portfolio fixture via simulated Alexa”). |
| **Steps** | Numbered reproduction steps. |
| **Expected** | What should have happened. |
| **Actual** | What happened instead. |
| **Severity** | `blocker` / `major` / `minor` / `cosmetic` |
| **Workaround** | How you unblocked yourself, or “none”. |
| **Actionable suggestion** | Concrete fix for Amazon, NaN provider, Vercel, or this repo. |
| **Evidence** | Link, screenshot path, commit, or tool trace id. |

---

## Example (delete before submit)

| Field | Example |
| --- | --- |
| **Date (UTC)** | 2026-10-12 |
| **Task** | Configure LLM base URL for local dev |
| **Steps** | 1. Set `ALEXA_SIM_LLM_API_KEY`. 2. Start web dev server. 3. Open simulation panel. |
| **Expected** | Chat uses NaN OpenAI-compatible endpoint. |
| **Actual** | Missing env docs in README caused 401 until key name was found in ADR. |
| **Severity** | minor |
| **Workaround** | Read `docs/hackathon/adr-001-alexa-simulation.md`. |
| **Actionable suggestion** | Add `.env.example` with non-secret defaults in delivery PR. |
| **Evidence** | MAC-371 |

---

## Running totals (optional)

| Severity | Count |
| --- | --- |
| blocker | 0 |
| major | 0 |
| minor | 0 |
| cosmetic | 0 |
