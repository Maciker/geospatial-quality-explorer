# Hackathon delivery checklist

Owner: Iker submits on Devpost. **Internal review cutoff: 2026-10-21.** Official deadline: **2026-10-23 21:00 Europe/Madrid** (12:00 PDT). Evaluation: November 9–20.

Only check a box when its evidence exists. A source change is not a production deploy, and prepared materials are not a submitted entry.

## Repository and access

- [x] Public repository and MIT license: https://github.com/Maciker/geospatial-quality-explorer
- [x] Production URL incorporated in documentation by PR #36.
- [ ] Prove clean checkout quick start and record source start/end commits or contribution PRs for the event window.
- [ ] Review secrets and third-party/data licenses; keep synthetic CC0 separate from Natural Earth public-domain provenance.
- [ ] Verify basemap terms and visible attribution for published media.

## Product proof

- [ ] Merge/deploy MAC-460 through the owner-approved workflow, then record deployed commit and URL.
- [ ] In production, verify map-unavailable mode retains chat, findings, Explain and export. In a WebGL-capable browser, verify the normal map/selection path.
- [ ] With a genuinely configured live model, validate the modified Natural Earth sample, select an incidence, explain it and export the same run. Record model/provider, time, observed latency and outcome. Do not silently substitute mock on failure.
- [ ] Check cold start/session recovery and a controlled provider failure without disabling limits.
- [ ] Download the ZIP and inspect `findings.qgs`, `findings.qml`, `findings.geojson`, `run-metadata.json`; cross-check identifiers/source hash/run.
- [ ] Open the final bundle in QGIS 3 and record the result. A generated ZIP or parsed XML alone is not desktop inspection.

## Video

- [ ] Review the corrected production voiceover and captions against `video-script.md`.
- [ ] Confirm no unshown live-voice, upstream-defect, automatic-repair, download or QGIS-inspection claim.
- [ ] Simulation disclosure and introduced-errors label are legible. Explain and attribution remain visible.
- [ ] Add a genuine QGIS take if available; otherwise keep the honest export-ready version and describe the evidence limit accurately.
- [ ] Review the narration voice/tool rights, no secrets, English, duration <3 minutes.
- [ ] Upload reviewed final file to **public YouTube or Vimeo** and save its URL.

## Devpost and feedback

- [ ] Review `devpost-submission.md` against the actual final build and video; add the public video URL.
- [ ] Review `product-feedback.md`: confirm the author’s actual onboarding and reuse decisions per tool. Internal env/router problems are not attributed to Amazon.
- [ ] Update `friction-log.md` with measured outcomes. Friction log is optional; up-to-10% bonus is not automatic.
- [ ] Select Alexa+ / explicitly labeled simulation. No official MCP/Agent Skill integration is claimed.
- [ ] If keeping Open Source mini-challenge, supply a concrete eligible contribution URL, repo URL, GitHub username and explanation. Public visibility alone is not the contribution evidence.
- [ ] Iker reviews materials by **21 October**; Iker submits by official deadline and records confirmation/entry URL in Linear.
- [ ] Keep supplied code/video/instructions accessible free to the judges through November 20. Official FAQ permits a runnable local repository plus video without requiring hosting; keep a useful local fallback even when offering a live demo.

Do not auto-submit, merge, deploy, accept new paid usage or claim completion of unchecked steps.
