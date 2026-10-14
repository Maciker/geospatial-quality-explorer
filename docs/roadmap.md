# Product roadmap

1. The TypeScript GIS MVP is on `main` (tracker MAC-32 / PR #15). The local demo, CLI, API, browser findings review, and QGIS export are implemented.
2. Current focus: stabilize that MVP for a QGIS reviewer — prove the portfolio fixture path, keep the five-minute demo runnable, and keep product docs aligned with post-merge reality ([MAC-50](https://linear.app/maciker/issue/MAC-50), task workspace `.ai/workspace/tasks/stabilize-mvp-qgis/`).
3. Hackathon line (decided 2026-10-12, [ADR 001](hackathon/adr-001-alexa-simulation.md)): a labeled Alexa+ web simulation over the same deterministic core, due 2026-10-23 ([MAC-229](https://linear.app/maciker/issue/MAC-229)–[MAC-232](https://linear.app/maciker/issue/MAC-232)). It adds a conversational surface and hosting, not new GIS rules or formats. The 2026-10-13 audit remediation (`.ai/workspace/tasks/audit-remediation/`) tightened polygon validity to `vector-core` 1.1.0 as a correctness fix inside the existing rule scope.
4. Do not open new GIS feature tickets outside these two lines until they are verified. A new grill / discovery cycle is required before post-MVP rules, formats, or products.

Keep Quality Explorer the primary GIS implementation; the other products can wait with ready backlogs.
