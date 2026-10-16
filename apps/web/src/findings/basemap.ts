import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

/** Vector tiles from OpenStreetMap data (OpenMapTiles schema); public instance, no API key. */
export const DEFAULT_BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export const BASEMAP_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> · <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>';

const PREFIX = "basemap-";

type BasemapPlan = {
  readonly sources: readonly { readonly id: string; readonly spec: SourceSpecification }[];
  readonly layers: readonly LayerSpecification[];
  readonly glyphs?: string;
  readonly sprite?: string;
};

/** `VITE_BASEMAP_STYLE_URL`: unset uses the default; empty or `off` keeps the plain background. */
export function resolveBasemapStyleUrl(configured: string | undefined): string | null {
  if (configured === undefined) return DEFAULT_BASEMAP_STYLE_URL;
  const value = configured.trim();
  return value === "" || value.toLowerCase() === "off" ? null : value;
}

/**
 * Turns a fetched (untrusted) MapLibre style into sources and layers that can be added under the
 * finding layers: ids are prefixed so they cannot collide, and tile sources carry an attribution.
 */
export function planBasemap(style: unknown): BasemapPlan | null {
  if (!isRecord(style) || style.version !== 8 || !isRecord(style.sources) || !Array.isArray(style.layers)) return null;
  const sources = Object.entries(style.sources)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]) && typeof entry[1].type === "string")
    .map(([id, spec]) => ({ id: PREFIX + id, spec: withAttribution(spec) as unknown as SourceSpecification }));
  const known = new Set(Object.keys(style.sources).map((id) => PREFIX + id));
  const layers = style.layers.flatMap((layer): LayerSpecification[] => {
    if (!isRecord(layer) || typeof layer.id !== "string" || typeof layer.type !== "string") return [];
    if (layer.source === undefined) return [{ ...layer, id: PREFIX + layer.id } as unknown as LayerSpecification];
    if (typeof layer.source !== "string" || !known.has(PREFIX + layer.source)) return [];
    return [{ ...layer, id: PREFIX + layer.id, source: PREFIX + layer.source } as unknown as LayerSpecification];
  });
  if (layers.length === 0) return null;
  return {
    sources,
    layers,
    ...(typeof style.glyphs === "string" ? { glyphs: style.glyphs } : {}),
    ...(typeof style.sprite === "string" ? { sprite: style.sprite } : {}),
  };
}

function withAttribution(spec: Record<string, unknown>): Record<string, unknown> {
  const tiled = spec.type === "vector" || spec.type === "raster";
  return tiled && spec.attribution === undefined ? { ...spec, attribution: BASEMAP_ATTRIBUTION } : spec;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
