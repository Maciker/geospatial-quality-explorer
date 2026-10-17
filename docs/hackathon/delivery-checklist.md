# Hackathon delivery checklist (human steps)

**Owner:** Iker submits on Devpost ([MAC-232](https://linear.app/maciker/issue/MAC-232)).  
**Deadline:** 2026-10-23 21:00 Europe/Madrid ([rules](https://amazonappdev2026.devpost.com/rules)).  
**Do not** mark Linear delivery complete until Devpost shows a submitted entry with URLs and receipt.

Agents prepare docs; humans review media, secrets, and public access.

---

## Repository and license (target ~2026-10-22)

- [x] Repository is **public** on GitHub (MIT already in `LICENSE`).
- [ ] README judge quick start and [demo.md](../demo.md) Alexa path work from a clean clone (`pnpm install`, `pnpm dev:api`, `pnpm dev:web`, `?sim=alexa`).
- [ ] No secrets in git history on the public default branch; `NAN_API_KEY` only in Vercel project settings.
- [ ] `THIRD_PARTY_NOTICES.md` and fixture licenses accurate for judges (synthetic CC0; Natural Earth samples as public domain per Natural Earth terms, not relabeled CC0).
- [ ] Note initial/final commit SHAs or PR numbers in Linear when submitting (per MAC-232 acceptance).

---

## Hosted demo

- [x] Vercel project live at https://geospatial-quality-explorer.vercel.app (replace placeholder in [devpost-submission.md](./devpost-submission.md) and README if linked).
- [ ] Vercel env: `NAN_API_KEY` scoped to **Production** only, optional `NAN_MODEL=qwen3.6`, `ALEXA_SIM_TIMEOUT_MS=55000` (function `maxDuration` is 60 s), provider **spend limit** set.
- [ ] Vercel Git fork protection left **on** (public repo); rotate the key if it was ever shared in chat or screenshots. See [development.md](../development.md#hosted-demo-vercel).
- [ ] Badge reads **Model: live LLM** on production; run validate → list → explain → export once, and open the downloaded `qgis-<run>.zip` in QGIS 3.
- [ ] Document cold-start/session TTL behavior if a judge reports a missing run id ([tool-contracts.md](./tool-contracts.md)).

---

## Demo video (< 3 min)

- [ ] Record using [video-script.md](./video-script.md) (TTS + screen capture), all shots with the **live LLM** badge after a rehearsal; re-record the earlier draft whose Explain and Export shots used the mock.
- [ ] Finding cards stay on screen through Explain and Export, and long ids wrap inside the chat (fixed in PR #26).
- [ ] First ~15 s: visible and spoken **simulation of Alexa+** disclosure.
- [ ] Shows validate, list, explain, export; optional refusal shot if under time cap.
- [ ] Upload to **public** YouTube or Vimeo; paste URL into Devpost and Linear.
- [ ] Iker reviews video for accuracy and labeling before publish.

---

## Devpost form

- [ ] Paste sections from [devpost-submission.md](./devpost-submission.md) (English).
- [ ] Attach **Product Feedback** from [product-feedback.md](./product-feedback.md) ([MAC-371](https://linear.app/maciker/issue/MAC-371)).
- [ ] Add repository URL, https://geospatial-quality-explorer.vercel.app, and video URL.
- [ ] Confirm Open Source mini-challenge fields if applicable.
- [ ] Submit on **2026-10-23** before 21:00 Madrid; save Devpost confirmation screenshot or link in Linear.
- [ ] Ensure free judge access through **2026-11-20** (per MAC-232).

---

## Explicit non-goals for this PR

- [ ] Do **not** merge agent docs PR until Iker reviews.
- [ ] Do **not** claim official Alexa+, MCP, or Agent Skill certification in any public copy.
- [ ] Do **not** add fictional friction log entries—extend [friction-log.md](./friction-log.md) only for real incidents.

---

## Quick links

| Item | Location |
| --- | --- |
| Devpost copy | [devpost-submission.md](./devpost-submission.md) |
| Video script | [video-script.md](./video-script.md) |
| Product Feedback | [product-feedback.md](./product-feedback.md) |
| Route decision | [adr-001-alexa-simulation.md](./adr-001-alexa-simulation.md) |
| Friction log | [friction-log.md](./friction-log.md) |
