import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

const fixturesDirectory = join(process.cwd(), "packages/quality/fixtures/vector");
const datasetName = "ne-admin0-westeurope-demo-errors";

/** Serves the real fixture from disk so the layout does not depend on the rate-limited fixture endpoint. */
async function stubFixtureSource(page: Page): Promise<void> {
  const bytes = readFileSync(join(fixturesDirectory, `${datasetName}.geojson`));
  const sidecar = JSON.parse(readFileSync(join(fixturesDirectory, `${datasetName}.fixture.json`), "utf8")) as Record<string, string>;
  const body = JSON.stringify({
    fixtureId: datasetName,
    label: sidecar.label,
    license: sidecar.license,
    sourceCrs: sidecar.defaultSourceCrs,
    sourceHash: createHash("sha256").update(bytes).digest("hex"),
    origin: sidecar.origin,
    transformation: sidecar.transformation,
    scaleNote: sidecar.scaleNote,
    didacticNote: sidecar.didacticNote,
    collection: JSON.parse(bytes.toString("utf8")),
  });
  await page.route("**/api/v1/alexa-sim/fixtures/*/source", (route) => route.fulfill({ status: 200, contentType: "application/json", body }));
}

const runId = "8420b6be93973000852ec044f3a1598469e520a87f8028b8134764da67f8d63d";
const longFeatureId = "urn:ine:es:municipio:22125:seccion:2212501001:distrito:01";

function finding(index: number, ruleId: string, featureId: string) {
  return {
    findingId: `${runId}:${index}:${ruleId}`,
    ruleId,
    featureId,
    severity: "error",
    explanation: `Feature id ${featureId} is used more than once in this collection, so every reference to it is ambiguous.`,
    suggestedAction: "Give each feature a unique id, or remove the duplicate. Source data was not modified.",
    geometry: null,
  };
}

/** Loads the demo-errors dataset through a stubbed chat reply so the layout is tested with a long provenance note and cards. */
async function openWithFindings(page: Page, featureId: string, extraFindings = 0): Promise<void> {
  await stubFixtureSource(page);
  await page.route("**/api/v1/alexa-sim/chat", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      sessionId: "layout-session-0001",
      runId,
      datasetName,
      sourceHash: "bfe80be1c8f795a81f429fab62a2dc94ba9c43f61e466d9322e4718d28c8b4a6",
      refused: false,
      qgisExport: null,
      llmMode: "mock",
      assistantMessage: `4 findings listed. Top finding: findingId ${runId}:1:identifier.duplicate on featureId ${featureId}.`,
      findings: [
        finding(1, "identifier.duplicate", featureId),
        finding(2, "identifier.duplicate", featureId),
        finding(3, "geometry.empty", "DEMO-EMPTY"),
        finding(4, "geometry.invalid", "PRT"),
        ...Array.from({ length: extraFindings }, (_, index) => finding(5 + index, "identifier.duplicate", `${featureId}-${5 + index}`)),
      ],
    }),
  }));
  await page.goto("/?sim=alexa");
  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByLabel("Layer provenance")).toContainText("NaturalEarth-public-domain", { timeout: 30_000 });
  await page.locator("html").evaluate((html) => { html.scrollTop = 0; });
}

type Box = { top: number; bottom: number; left: number; right: number; height: number };

async function box(locator: Locator): Promise<Box> {
  const b = (await locator.boundingBox())!;
  return { top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width, height: b.height };
}

async function boxes(page: Page) {
  const viewport = page.viewportSize()!;
  return {
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    documentWidth: await page.locator("html").evaluate((html) => html.scrollWidth),
    map: await box(page.getByLabel("Findings map")),
    mapRegion: await box(page.getByLabel("Map workspace")),
    rail: await box(page.getByLabel("Findings list")),
    chat: await box(page.getByLabel("Alexa simulation chat")),
    input: await box(page.getByLabel("Message Alexa simulation")),
    voice: await box(page.getByRole("button", { name: /^Voice/ })),
    send: await box(page.getByRole("button", { name: /^(Send|Thinking)/ })),
  };
}

const desktopSizes = [[1440, 900], [1280, 720], [1024, 768]] as const;
const stackedSizes = [[800, 1000], [700, 450], [667, 375], [390, 844], [375, 667], [320, 256]] as const;
// Wider than the stacked breakpoint but too short or narrow for the viewport-locked desktop layout (browser zoom, small laptops).
const shortSizes = [[933, 600], [1100, 650], [1280, 500]] as const;
// Short but wide windows keep the viewport-locked layout, so the composer must still be on screen.
const lockedShortSizes = [[1366, 650], [1366, 601], [1536, 730], [1440, 621], [1101, 701], [1101, 601], [901, 701], [1251, 601], [1401, 601]] as const;

async function expectUsable(page: Page): Promise<Awaited<ReturnType<typeof boxes>>> {
  const b = await boxes(page);
  expect(b.map.height).toBeGreaterThanOrEqual(192);
  expect(b.documentWidth).toBeLessThanOrEqual(b.viewportWidth);
  expect(b.input.right).toBeLessThanOrEqual(b.viewportWidth);
  await page.getByLabel("Message Alexa simulation").scrollIntoViewIfNeeded();
  const reached = await boxes(page);
  expect(reached.input.top).toBeGreaterThanOrEqual(0);
  expect(reached.send.bottom).toBeLessThanOrEqual(reached.viewportHeight + 1);
  return b;
}

for (const [width, height] of desktopSizes) {
  test(`desktop ${width}x${height} shows the map and the whole composer without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openWithFindings(page, "ESP");
    const b = await boxes(page);
    expect(b.map.height).toBeGreaterThanOrEqual(240);
    expect(b.send.bottom).toBeLessThanOrEqual(b.viewportHeight);
    expect(b.input.bottom).toBeLessThanOrEqual(b.viewportHeight);
    expect(b.input.right).toBeLessThanOrEqual(b.voice.left + 0.5);
    expect(b.documentWidth).toBeLessThanOrEqual(b.viewportWidth);
  });
}

for (const [width, height] of stackedSizes) {
  test(`stacked ${width}x${height} keeps a usable map, no overlap and a reachable composer`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openWithFindings(page, "ESP");
    const b = await expectUsable(page);
    expect(b.mapRegion.bottom).toBeLessThanOrEqual(b.rail.top + 1);
    expect(b.rail.bottom).toBeLessThanOrEqual(b.chat.top + 1);
  });
}

for (const [width, height] of shortSizes) {
  test(`short ${width}x${height} scrolls the page and keeps a usable map`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openWithFindings(page, "ESP");
    await expectUsable(page);
  });
}

for (const [width, height] of lockedShortSizes) {
  test(`locked ${width}x${height} keeps the composer on screen with a list and a map`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openWithFindings(page, "ESP", 16);
    const b = await boxes(page);
    const cards = await box(page.locator("[class*=cards]"));
    const documentHeight = await page.locator("html").evaluate((html) => html.scrollHeight);
    expect(documentHeight).toBeLessThanOrEqual(height);
    expect(b.send.bottom).toBeLessThanOrEqual(b.viewportHeight);
    expect(b.map.height).toBeGreaterThanOrEqual(190);
    expect(cards.height).toBeGreaterThanOrEqual(56);
  });
}

// The viewport-locked and the unlocked layouts both have to cope with the 20 findings a list can return.
// Seams of the unlock media query: 600/601 high, and 1100 wide with 700/701 high (900/901 wide is covered by the stacked sizes).
const crowdedSizes = [[933, 600], [1100, 700], [1100, 701], [1440, 600], [1440, 601]] as const;

for (const [width, height] of crowdedSizes) {
  test(`20 findings at ${width}x${height} keep the list, the map and the page bounded`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openWithFindings(page, "ESP", 16);
    const b = await expectUsable(page);
    expect(b.map.height).toBeLessThanOrEqual(b.viewportHeight);
    const cards = await box(page.locator("[class*=cards]"));
    expect(cards.height).toBeLessThanOrEqual(260);
    expect(cards.height).toBeGreaterThanOrEqual(56);
  });
}

for (const [width, height] of [[1440, 900], [390, 844]] as const) {
  test(`review mode keeps its 420px map at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(`/?run=${readFileSync("/tmp/geospatial-quality-explorer-run-id", "utf8").trim()}`);
    await expect(page.getByLabel("Findings map").locator("canvas")).toBeVisible();
    const map = await box(page.getByLabel("Findings map"));
    expect(map.height).toBeGreaterThanOrEqual(410);
    expect(map.height).toBeLessThanOrEqual(430);
    // The map wrapper must not stretch to the height of the findings list and leave a gap above the detail.
    const detail = await box(page.getByLabel("Finding detail"));
    expect(detail.top - map.bottom).toBeLessThanOrEqual(40);
  });
}

test("long unbroken feature ids stay inside the findings rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWithFindings(page, longFeatureId);
  await page.getByLabel("Findings list").getByRole("button", { name: /identifier\.duplicate/ }).first().click();
  const copy = await box(page.getByRole("button", { name: "Copy findingId" }));
  const rail = await box(page.getByLabel("Findings list"));
  expect(copy.right).toBeLessThanOrEqual(rail.right);
  const overflows = await page.getByLabel("Finding detail").evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  expect(overflows).toBe(false);
});

test("the keyboard focus ring of a finding card is not clipped by its scroll container", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openWithFindings(page, "ESP");
  await page.keyboard.press("Shift");
  const card = page.getByLabel("Findings list").getByRole("button", { name: /geometry\.empty/ });
  await card.focus();
  await expect(card).toHaveCSS("outline-width", "2px");
  await expect(card).toHaveCSS("outline-offset", "2px");
  const cards = await box(page.locator("[class*=cards]"));
  const focused = await box(card);
  const ringReach = 4;
  expect(cards.left).toBeLessThanOrEqual(focused.left - ringReach);
  expect(cards.right).toBeGreaterThanOrEqual(focused.right + ringReach);
});
