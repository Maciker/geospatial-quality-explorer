import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("Alexa+ simulation maps Natural Earth demo-errors and explains the selected finding", async ({ page }) => {
  await page.goto("/?sim=alexa");
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+ — not an Amazon product");

  await page.getByLabel("Message Alexa simulation").fill("Validate the ne-admin0-westeurope-demo-errors fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByLabel("Alexa simulation chat").getByText(/runId/i)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Active dataset summary")).toContainText("ne-admin0-westeurope-demo-errors");
  await expect(page.getByLabel("Layer provenance")).toContainText("NaturalEarth-public-domain");

  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  const cards = page.getByLabel("Finding cards and map").getByRole("button", { name: /(geometry|identifier)\./ });
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/sin geometría/)).toBeVisible();

  const emptyCard = page.getByLabel("Finding cards and map").getByRole("button", { name: /geometry\.empty/ });
  await emptyCard.click();
  await expect(page.getByLabel("Finding detail")).toContainText("no geometry");

  const invalidCard = page.getByLabel("Finding cards and map").getByRole("button", { name: /geometry\.invalid/ });
  await invalidCard.click();
  await expect(invalidCard.getByText(/findingId [a-f0-9]{64}:\d+:geometry\.invalid/)).toBeVisible();

  await page.getByRole("button", { name: "Explain selected finding" }).click();
  await expect(page.getByLabel("Alexa simulation chat").getByText(/geometry\.invalid/).last()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByLabel("Message Alexa simulation").fill("Export QGIS.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("The QGIS export is ready. Download the bundle from the simulation panel.")).toBeVisible({
    timeout: 30_000,
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download last QGIS bundle" }).click();
  expect((await download).suggestedFilename()).toMatch(/^qgis-[a-f0-9]{8}\.zip$/);

  await page.getByLabel("Findings map").screenshot({
    path: "apps/web/test-results/mac-402-ne-demo-errors-map.png",
  });
});
