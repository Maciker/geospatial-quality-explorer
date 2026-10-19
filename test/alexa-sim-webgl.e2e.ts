import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("a reviewer can explain findings and download QGIS when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(String.raw`(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
      if (contextId === "webgl" || contextId === "webgl2" || contextId === "experimental-webgl") return null;
      return Reflect.apply(originalGetContext, this, [contextId, ...args]);
    };
  })();`);

  await page.goto("/?sim=alexa");

  await expect(page.getByRole("status", { name: "Map unavailable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit layer" })).toBeDisabled();
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+");
  await page.getByLabel("Message Alexa simulation").fill("Validate the ne-admin0-westeurope-demo-errors fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  const cards = page.getByLabel("Findings list").getByRole("button", { name: /(geometry|identifier)\./ });
  await expect(cards).toHaveCount(4, { timeout: 30_000 });
  await cards.filter({ hasText: "geometry.invalid" }).click();
  const detail = page.getByLabel("Finding detail");
  await expect(detail).toContainText("A ring self-intersects.");
  await page.getByRole("button", { name: "Explain selected finding" }).click();
  const conversation = page.getByRole("log", { name: "Conversation" });
  await expect(conversation.getByText(/findingId.*geometry\.invalid/).last()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Export QGIS via Alexa" }).click();
  await expect(conversation.getByText(/The QGIS export is ready/)).toBeVisible({ timeout: 30_000 });
  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download last QGIS bundle" }).click();
  expect((await pendingDownload).suggestedFilename()).toMatch(/^qgis-[a-f0-9]{8}\.zip$/);
  await expect(page.getByRole("status", { name: "Map unavailable" })).toBeVisible();
});
