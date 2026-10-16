# Summary: MAC-413

## Delivered

Six desktop QA fixes for the GIS Alexa shell after #30/#31:

1. Selected finding uses gold fill + thick dark outline; unselected overlays dimmed.
2. Selected fit pads bbox by 2° and caps maxZoom at 6 (Explain keeps context).
3. Copy findingId shows ephemeral “Copied” + aria-live.
4. Source-only fit clips overseas multipolygon parts (Guiana/Svalbard) for framing only.
5. Card label “no geometry” (English); e2e updated.
6. Long ids break at `:`/`-` via ZWSP + `overflow-wrap: break-word`.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| All errors same red | Gold selected / dim others | PRT distinguishable |
| Explain overzoom | Padded selected fit | Regional context |
| Silent copy | Copied feedback | Confirm action |
| Overseas stretch | Mainland fit parts | Europe framed |
| sin geometría | no geometry | English UI |
| Mid-token wrap | Separator breaks | Readable ids |
