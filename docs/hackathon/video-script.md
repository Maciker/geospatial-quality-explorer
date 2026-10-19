# Demo video — corrected narration and evidence

Internal cutoff: **2026-10-21**. Public YouTube/Vimeo video must be under 3 minutes. This version reuses the supplied 72.7-second recording with new production voiceover. It does not claim microphone input, geometry repair, completed ZIP download or QGIS desktop inspection.

## Narrative and shots

| Shot | Show | Say |
| --- | --- | --- |
| Problem / disclosure | Simulation and live/mock labels, product visible | Before publishing a map, a reviewer needs to know which feature failed and why. This is Geospatial Quality Explorer, a labeled Alexa Plus simulation. |
| Validate | Modified Natural Earth sample and real validation response | I ask the assistant to validate a Natural Earth sample of Western Europe. We deliberately introduced errors in this copy for the demo. The language model calls tools, and a deterministic engine performs the checks. |
| Finding | Selected invalid polygon in the derived sample | The review finds four issues. In our modified sample, this polygon crosses itself. I select it on the map. The source data is never modified. |
| Explain | Selected detail and matching cited response, copy identifier | I ask for an explanation of the selected finding. Its rule and identifier stay linked to the map, so the result can be traced. I can copy that identifier for a follow up ticket. |
| Export | Real export-ready result; do not invent a download | Next, I ask the assistant to prepare a Q GIS bundle for this review. The export contains a project, findings, styling, and run metadata for desktop review. |
| Close | Geometry-empty finding remains in list | Features without geometry remain visible in the findings list. Validate, understand, and export a traceable spatial review. The assistant explains the evidence; it does not repair the data. |

## Mandatory editing details

- Label the sample on screen: **Natural Earth sample — errors introduced for this demo**. Do not attribute injected defects to the upstream source.
- Keep simulation and live/mock labels visible. Voiceover is narration, not proof of live voice input.
- Keep Explain and the selected feature readable; captions must not cover controls or attribution.
- No automatic-repair claim. No fake ticket creation, desktop proof, live-model metrics or recovery result.
- Preserve the same dataset/run across the walkthrough. If waits are abbreviated or held for narration, do not imply a measured response time.
- Add public video URL after author review and upload; never mark submitted just because a local file exists.

## Stronger optional final shot (still pending)

Record the **actual** downloaded bundle for the same run, extract it and open `findings.qgs` in QGIS 3. Compare a finding and run metadata with the browser. Only then append: “I download the bundle and open its project in QGIS. The findings and run metadata travel together.”

If this take cannot be made, submit an honest export-ready walkthrough rather than fabricated desktop footage. The final bundle inspection remains on the delivery checklist.

## Voice variant

To highlight voice, re-record a real utterance with Voice on, microphone capture and visible transcription. The supplied recording shows Voice off, so the replacement narration uses “I ask” rather than “by voice”.
