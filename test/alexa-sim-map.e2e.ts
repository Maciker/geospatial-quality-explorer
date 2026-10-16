import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("Alexa+ simulation maps Natural Earth demo-errors and explains the selected finding", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/?sim=alexa");
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+ — not an Amazon product");

  // role=log is an implicit polite live region, so screen readers hear new replies appended inside it.
  const conversation = page.getByRole("log", { name: "Conversation" });
  await expect(conversation).toBeVisible();

  await page.getByLabel("Message Alexa simulation").fill("Validate the ne-admin0-westeurope-demo-errors fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(conversation.getByText(/runId/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Active dataset summary")).toContainText("ne-admin0-westeurope-demo-errors");
  await expect(page.getByLabel("Layer provenance")).toContainText("NaturalEarth-public-domain");

  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  const cards = page.getByLabel("Findings list").getByRole("button", { name: /(geometry|identifier)\./ });
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  const emptyCard = page.getByLabel("Findings list").getByRole("button", { name: /geometry\.empty/ });
  await expect(emptyCard).toContainText(/no geometry/);

  const map = page.getByLabel("Findings map");
  await expect(map.locator("canvas")).toBeVisible();
  await expect(map).toBeInViewport();

  await emptyCard.click();
  await expect(page.getByLabel("Finding detail")).toContainText("feature has no geometry on the map");

  const invalidCard = page.getByLabel("Findings list").getByRole("button", { name: /geometry\.invalid/ });
  await invalidCard.click();
  const detailText = await page.getByLabel("Finding detail").innerText();
  expect(detailText).toMatch(/findingId [a-f0-9]{64}:\d+:geometry\.invalid/);
  expect(detailText).not.toContain("\u200b");

  await page.getByRole("button", { name: "Explain selected finding" }).click();
  const assistant = page.getByLabel("Alexa simulation chat").locator("[data-role='assistant']");
  const explained = assistant.filter({ hasText: /findingId [a-f0-9]{64}:\d+:geometry\.invalid/ }).last();
  await expect(explained).toBeVisible({ timeout: 30_000 });
  await expect(explained).toBeInViewport();

  await page.getByLabel("Message Alexa simulation").fill("Export QGIS.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("The QGIS export is ready. Download the bundle from the simulation panel.")).toBeVisible({
    timeout: 30_000,
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download last QGIS bundle" }).click();
  expect((await download).suggestedFilename()).toMatch(/^qgis-[a-f0-9]{8}\.zip$/);

  await expect(page.getByLabel("Layer provenance")).toContainText("NaturalEarth-public-domain");
  await expect(page.getByLabel("Layer provenance")).toContainText("EPSG:4326");
  await map.screenshot({
    path: "apps/web/test-results/mac-403-ne-demo-errors-map.png",
  });
});
