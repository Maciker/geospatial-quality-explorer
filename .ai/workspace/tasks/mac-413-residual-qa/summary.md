# Summary: MAC-413 residual QA

## Delivered

Post-#32 re-QA residuals:

1. Validate reply hydrates finding cards (no separate List findings required).
2. Auto-select prefers a card with map geometry; skip map refit on DEMO-EMPTY click.
3. Long hex finding/run ids chunk every 8 chars for wrapping; rule tokens stay intact.
4. e2e asserts four cards after validate.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| «No findings yet» after validate | Cards from validate reply | Rail matches run |
| Wide Europe / tiny Portugal after validate | Fit to first drawable finding | Hydrate + preferred selection |
| DEMO-EMPTY click zooms Iberia | Selection without refit | No yank on empty geometry |
| 64-char hex mid-break | Chunked hex + break-word | Readable ids |
