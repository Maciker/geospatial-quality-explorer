import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import { planBasemap } from "./basemap";

const BASEMAP_TIMEOUT_MS = 6000;

/** The slice of `maplibregl.Map` the loader needs, so it can be tested without a browser. */
export type BasemapTarget = {
  addSource(id: string, spec: SourceSpecification): unknown;
  addLayer(layer: LayerSpecification, beforeId?: string): unknown;
  setGlyphs(url: string): unknown;
  setSprite(url: string): unknown;
  getStyle(): unknown;
  getLayer(id: string): unknown;
  getSource(id: string): unknown;
  removeLayer(id: string): unknown;
  removeSource(id: string): unknown;
};

/**
 * Adds the vector basemap below `beforeLayerId`. Returns true when it was added. Any failure
 * (offline, provider down, unexpected JSON, a layer MapLibre rejects) leaves the plain background:
 * whatever was added before the failure is removed again, so findings stay usable.
 */
export async function loadBasemap(
  map: BasemapTarget,
  styleUrl: string,
  beforeLayerId: string,
  signal: AbortSignal,
  fetchStyle: typeof fetch = fetch,
): Promise<boolean> {
  const addedSources: string[] = [];
  const addedLayers: string[] = [];
  try {
    const response = await fetchStyle(styleUrl, { signal: AbortSignal.any([signal, AbortSignal.timeout(BASEMAP_TIMEOUT_MS)]) });
    if (!response.ok) return false;
    const plan = planBasemap(await response.json());
    if (!plan || signal.aborted) return false;
    for (const source of plan.sources) {
      map.addSource(source.id, source.spec);
      addedSources.push(source.id);
    }
    for (const layer of plan.layers) {
      map.addLayer(layer, beforeLayerId);
      addedLayers.push(layer.id);
    }
    if (plan.glyphs) map.setGlyphs(plan.glyphs);
    if (plan.sprite) map.setSprite(plan.sprite);
    return true;
  } catch {
    // A removed map (unmount during the fetch) has no style left to clean.
    if (map.getStyle()) {
      for (const id of addedLayers) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of addedSources) if (map.getSource(id)) map.removeSource(id);
    }
    return false;
  }
}
