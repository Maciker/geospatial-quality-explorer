import { describe, expect, it, vi } from "vitest";
import { type BasemapTarget, loadBasemap } from "./basemapLoader";

const style = {
  version: 8,
  glyphs: "https://tiles.example/fonts/{fontstack}/{range}.pbf",
  sprite: "https://tiles.example/sprites/positron",
  sources: { omt: { type: "vector", url: "https://tiles.example/planet" } },
  layers: [
    { id: "water", type: "fill", source: "omt", "source-layer": "water" },
    { id: "roads", type: "line", source: "omt", "source-layer": "transportation" },
  ],
};

function fakeMap(overrides: Partial<BasemapTarget> = {}) {
  const sources = new Set<string>();
  const layers = new Set<string>();
  const map: BasemapTarget = {
    addSource: vi.fn((id: string) => void sources.add(id)),
    addLayer: vi.fn((layer: { id: string }) => void layers.add(layer.id)),
    setGlyphs: vi.fn(),
    setSprite: vi.fn(),
    getStyle: vi.fn(() => ({})),
    getLayer: vi.fn((id: string) => (layers.has(id) ? {} : undefined)),
    getSource: vi.fn((id: string) => (sources.has(id) ? {} : undefined)),
    removeLayer: vi.fn((id: string) => void layers.delete(id)),
    removeSource: vi.fn((id: string) => void sources.delete(id)),
    ...overrides,
  };
  return { map, sources, layers };
}

const offline = vi.fn(async () => {
  throw new TypeError("Failed to fetch");
});

const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));

describe("loadBasemap", () => {
  it("adds the prefixed sources and layers below the given layer, then glyphs and sprite", async () => {
    const { map, sources, layers } = fakeMap();
    await expect(loadBasemap(map, "https://s/style.json", "source-fill", new AbortController().signal, ok(style))).resolves.toBe(true);
    expect([...sources]).toEqual(["basemap-omt"]);
    expect([...layers]).toEqual(["basemap-water", "basemap-roads"]);
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: "basemap-water" }), "source-fill");
    expect(map.setGlyphs).toHaveBeenCalledWith(style.glyphs);
    expect(map.setSprite).toHaveBeenCalledWith(style.sprite);
  });

  it("keeps the plain background when the provider answers with an error", async () => {
    const { map } = fakeMap();
    const unavailable = vi.fn(async () => new Response("down", { status: 503 }));
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, unavailable)).resolves.toBe(false);
    expect(map.addSource).not.toHaveBeenCalled();
  });

  it("keeps the plain background when the response is not a usable style", async () => {
    const { map } = fakeMap();
    const html = vi.fn(async () => new Response("<!doctype html>", { status: 200 }));
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, html)).resolves.toBe(false);
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, ok({ version: 8, sources: {}, layers: [] }))).resolves.toBe(false);
    expect(map.addSource).not.toHaveBeenCalled();
  });

  it("keeps the plain background when the network fails", async () => {
    const { map } = fakeMap();
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, offline)).resolves.toBe(false);
  });

  it("removes what it already added when a layer is rejected midway", async () => {
    const { map, sources, layers } = fakeMap();
    let calls = 0;
    map.addLayer = vi.fn((layer: { id: string }) => {
      calls += 1;
      if (calls === 2) throw new Error("bad layer");
      layers.add(layer.id);
    });
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, ok(style))).resolves.toBe(false);
    expect([...sources]).toEqual([]);
    expect([...layers]).toEqual([]);
    expect(map.setGlyphs).not.toHaveBeenCalled();
  });

  it("adds nothing when the map is unmounted while the style is loading", async () => {
    const { map } = fakeMap();
    const abort = new AbortController();
    const slow = vi.fn(async () => {
      abort.abort();
      return new Response(JSON.stringify(style), { status: 200 });
    });
    await expect(loadBasemap(map, "u", "source-fill", abort.signal, slow)).resolves.toBe(false);
    expect(map.addSource).not.toHaveBeenCalled();
  });

  it("does not touch a removed map when it fails", async () => {
    const { map } = fakeMap({ getStyle: vi.fn(() => undefined) });
    await expect(loadBasemap(map, "u", "source-fill", new AbortController().signal, offline)).resolves.toBe(false);
    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });
});
