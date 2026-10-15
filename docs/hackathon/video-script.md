# Demo video script (< 3 minutes)

**Purpose:** Public YouTube/Vimeo upload for Devpost ([MAC-232](https://linear.app/maciker/issue/MAC-232)).  
**Flow:** Matches [docs/demo.md](../demo.md) — Validate → List → Explain → Export QGIS.  
**Production:** TTS voice (Kokoro) reads **Narration**; screen capture follows **UI action** each shot.  
**Labeling:** On-screen badges and spoken intro must say this is a **simulation of Alexa+**, not an Amazon product.

**Total target:** ~2:45 (hard cap 2:59).

| Shot | Time (mm:ss) | Cumulative |
| --- | --- | --- |
| 1 | 0:00–0:12 | 0:12 |
| 2 | 0:12–0:22 | 0:22 |
| 3 | 0:22–0:38 | 0:38 |
| 4 | 0:38–1:05 | 1:05 |
| 5 | 1:05–1:28 | 1:28 |
| 6 | 1:28–1:48 | 1:48 |
| 7 | 1:48–2:08 | 2:08 |
| 8 | 2:08–2:28 | 2:28 |
| 9 | 2:28–2:45 | 2:45 |

Record against `<DEMO_URL>` when live, or local `pnpm dev:web` with `?sim=alexa` and the same UI. Prefer **live LLM** badge if keys are set; **deterministic mock** is acceptable if narration mentions both modes.

---

## Shot 1 — Title and simulation disclosure (0:00–0:12)

**UI action:** Open the app at `<DEMO_URL>/?sim=alexa` (or local equivalent). Hold full viewport so both badges are readable: *Simulation of Alexa+ — not an Amazon product* and *Model: …*.

**Narration:**  
This is Geospatial Quality Explorer, a labeled simulation of Alexa plus for GIS quality review. It is not an official Amazon Alexa skill. The validation engine is deterministic; the language model only calls tools and cites their results.

---

## Shot 2 — Problem in one sentence (0:12–0:22)

**UI action:** Brief pan from the map panel to the empty chat input; no typing yet.

**Narration:**  
Before publishing vector data, teams need traceable checks: which file, which rules, and which feature failed. We built a conversational path on top of a fixed ruleset, with every issue tied to identifiers you can audit.

---

## Shot 3 — Validate the portfolio fixture (0:22–0:38)

**UI action:** Click or focus the chat input. Type or paste: `Validate the portfolio fixture.` Send. Wait until the assistant reply appears and mentions a sixty-four character run id.

**Narration:**  
First I ask to validate the portfolio fixture. The assistant runs the deterministic validator and returns a run id. That id anchors every later finding in this session.

---

## Shot 4 — List the findings (0:38–1:05)

**UI action:** Send: `List the findings.` Wait for finding cards and map highlights. Slowly scroll one card so `findingId`, `ruleId`, and `featureId` are legible; map should show corresponding features.

**Narration:**  
Next, list the findings. Each card shows a finding id, rule id, and feature id from the core—not from the model’s imagination. The map draws the same features so you can see geometry in context.

---

## Shot 5 — Explain the next finding (1:05–1:28)

**UI action:** Send: `Explain the next finding.` Wait for the explanation panel or assistant message. If the UI shows rule text or suggested action from the core, hold on that text.

**Narration:**  
Explain the next finding pulls wording from the deterministic rules engine. The model does not decide whether a polygon is valid; it reads what the tools returned and cites the ids.

---

## Shot 6 — Refusal boundary (optional, if time) (1:28–1:48)

**UI action:** Send: `Repair the invalid geometry.` Show the refusal message. If this shot is cut for time, skip to Shot 7 and keep total under three minutes.

**Narration:**  
If I ask it to repair geometry, it refuses. Source GeoJSON is never mutated by AI—only validators produce findings.

---

## Shot 7 — Export QGIS (1:48–2:08)

**UI action:** Send: `Export QGIS.` When the reply says the bundle is ready, click **Download last QGIS bundle**. Show the single `qgis-<run>.zip` download completing (filename visible if possible).

**Narration:**  
Export QGIS downloads one zip for desktop review: a QGIS project, its layer style, the findings GeoJSON and the run metadata, all from the same run.

---

## Shot 8 — QGIS proof (2:08–2:28)

**UI action:** Unzip `qgis-<run>.zip` into one folder, then cut to QGIS 3 with `findings.qgs` opened from that folder (the project loads `./findings.geojson` next to it). Pan/zoom one highlighted finding layer. Rehearse this once before recording.

**Narration:**  
In QGIS, stewards can continue review with familiar tools. The conversational demo and the desktop project describe the same run.

---

## Shot 9 — Close: stack and links (2:28–2:45)

**UI action:** Return to browser; show simulation badge again. Optional: flash README or repo URL on a simple title card—not required if repo URL is in video description.

**Narration:**  
Built with TypeScript, a deterministic quality core, tool contracts, and an OpenAI-compatible model on the server. Repository is open source under MIT. Try the simulation at the link in the description.

---

## Post-production checklist

- [ ] Total runtime under three minutes.
- [ ] Spoken and visible **simulation** disclosure in the first fifteen seconds.
- [ ] All four core commands shown: validate, list, explain, export (refusal shot optional).
- [ ] No API keys, env files, or secrets on screen.
- [ ] Video set to **public** on YouTube or Vimeo before Devpost submit.
