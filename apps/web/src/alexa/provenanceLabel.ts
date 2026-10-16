import type { AlexaFixtureSource } from "./alexaSimApi";

/**
 * One-line provenance of the layer on the map. Licence, CRS and hash come first because the note
 * may be clamped to two lines in tight windows; the dataset name and the scale note follow.
 */
export function buildProvenanceLabel(
  layer: Pick<AlexaFixtureSource, "label" | "license" | "sourceCrs"> & { scaleNote?: string | undefined },
  sourceHash: string | null,
): string {
  return [
    layer.license,
    layer.sourceCrs,
    ...(sourceHash ? [`hash ${sourceHash.slice(0, 12)}…`] : []),
    layer.label,
    ...(layer.scaleNote ? [layer.scaleNote] : []),
  ].join(" · ");
}
