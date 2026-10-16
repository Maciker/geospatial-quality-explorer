import { describe, expect, it } from "vitest";
import { BASEMAP_ATTRIBUTION, DEFAULT_BASEMAP_STYLE_URL, planBasemap, resolveBasemapStyleUrl } from "./basemap";

const vectorStyle = {
  version: 8,
  glyphs: "https://tiles.example/fonts/{fontstack}/{range}.pbf",
  sprite: "https://tiles.example/sprites/positron",
  sources: {
    openmaptiles: { type: "vector", url: "https://tiles.example/planet" },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#fff" } },
    { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": "#cde" } },
    { id: "place_label", type: "symbol", source: "openmaptiles", "source-layer": "place", layout: { "text-field": "{name}" } },
  ],
};

describe("resolveBasemapStyleUrl", () => {
  it("uses the OpenFreeMap vector style when nothing is configured", () => {
    expect(resolveBasemapStyleUrl(undefined)).toBe(DEFAULT_BASEMAP_STYLE_URL);
    expect(DEFAULT_BASEMAP_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/positron");
  });

  it("disables the basemap for an empty value or off", () => {
    expect(resolveBasemapStyleUrl("")).toBeNull();
    expect(resolveBasemapStyleUrl("  ")).toBeNull();
    expect(resolveBasemapStyleUrl("off")).toBeNull();
  });

  it("uses a configured style URL", () => {
    expect(resolveBasemapStyleUrl("/style.json")).toBe("/style.json");
  });
});

describe("planBasemap", () => {
  it("prefixes source and layer ids so they cannot collide with the finding layers", () => {
    const plan = planBasemap(vectorStyle);
    expect(plan?.sources.map((source) => source.id)).toEqual(["basemap-openmaptiles"]);
    expect(plan?.layers.map((layer) => layer.id)).toEqual(["basemap-background", "basemap-water", "basemap-place_label"]);
    expect(plan?.layers[1]).toMatchObject({ source: "basemap-openmaptiles", "source-layer": "water" });
  });

  it("keeps vector sources vector and adds the attribution", () => {
    const plan = planBasemap(vectorStyle);
    expect(plan?.sources[0]?.spec).toMatchObject({ type: "vector", url: "https://tiles.example/planet", attribution: BASEMAP_ATTRIBUTION });
    expect(BASEMAP_ATTRIBUTION).toContain("OpenStreetMap contributors");
    expect(BASEMAP_ATTRIBUTION).toContain("OpenMapTiles");
  });

  it("keeps an attribution the style already declares", () => {
    const plan = planBasemap({ ...vectorStyle, sources: { s: { type: "vector", url: "u", attribution: "custom" } }, layers: [{ id: "l", type: "fill", source: "s" }] });
    expect(plan?.sources[0]?.spec).toMatchObject({ attribution: "custom" });
  });

  it("returns the glyphs and sprite endpoints", () => {
    const plan = planBasemap(vectorStyle);
    expect(plan?.glyphs).toBe("https://tiles.example/fonts/{fontstack}/{range}.pbf");
    expect(plan?.sprite).toBe("https://tiles.example/sprites/positron");
  });

  it("rejects anything that is not a version 8 style with sources and layers", () => {
    expect(planBasemap(null)).toBeNull();
    expect(planBasemap("<!doctype html>")).toBeNull();
    expect(planBasemap({ version: 7, sources: {}, layers: [] })).toBeNull();
    expect(planBasemap({ version: 8, sources: {} })).toBeNull();
    expect(planBasemap({ version: 8, layers: [] })).toBeNull();
  });

  it("drops layers whose source is missing", () => {
    const plan = planBasemap({ ...vectorStyle, layers: [...vectorStyle.layers, { id: "orphan", type: "fill", source: "nope" }] });
    expect(plan?.layers.map((layer) => layer.id)).not.toContain("basemap-orphan");
  });

  it("rejects a style with no drawable layers", () => {
    expect(planBasemap({ version: 8, sources: {}, layers: [] })).toBeNull();
  });
});
