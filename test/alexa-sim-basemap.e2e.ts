import { expect, test } from "@playwright/test";
import { E2E_BASEMAP_STYLE_URL as STYLE_URL, E2E_BASEMAP_TILES } from "./e2eBasemap.js";

const TILE_PATTERN = `${E2E_BASEMAP_TILES}/**`;

/** A vector style served locally, so the suite never reaches a third-party tile host. */
const stubStyle = {
  version: 8,
  sources: {
    stub: { type: "vector", tiles: [`${E2E_BASEMAP_TILES}/{z}/{x}/{y}.pbf`], maxzoom: 6 },
  },
  layers: [
    { id: "land", type: "background", paint: { "background-color": "#eef2ee" } },
    { id: "water", type: "fill", source: "stub", "source-layer": "water", paint: { "fill-color": "#b8d0e6" } },
  ],
};

test("a vector basemap loads under the findings and carries its attribution", async ({ page }) => {
  await page.route(STYLE_URL, (route) => route.fulfill({ json: stubStyle }));
  await page.route(TILE_PATTERN, (route) => route.fulfill({ status: 404 }));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/?sim=alexa");

  const map = page.getByLabel("Findings map");
  await expect(map).toHaveAttribute("data-basemap", "on", { timeout: 15_000 });
  await expect(map.locator(".maplibregl-ctrl-attrib")).toContainText("OpenStreetMap contributors");

  await page.getByLabel("Message Alexa simulation").fill("Validate the ne-admin0-westeurope-demo-errors fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByLabel("Active dataset summary")).toContainText("ne-admin0-westeurope-demo-errors", { timeout: 30_000 });
  await expect(page.getByLabel("Layer provenance")).toContainText("NaturalEarth-public-domain");
  await expect(page.getByLabel("Layer provenance")).toContainText("EPSG:4326");
});

test("the plain background stays when the basemap style cannot be used", async ({ page }) => {
  await page.route(STYLE_URL, (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.setViewportSize({ width: 1366, height: 768 });
  const styleRequest = page.waitForResponse(STYLE_URL);
  await page.goto("/?sim=alexa");
  await styleRequest;

  const map = page.getByLabel("Findings map");
  await expect(map.locator("canvas")).toBeVisible();
  await page.waitForTimeout(300);
  await expect(map).toHaveAttribute("data-basemap", "off");
  await expect(map.locator(".maplibregl-ctrl-attrib")).not.toContainText("OpenStreetMap");
});
