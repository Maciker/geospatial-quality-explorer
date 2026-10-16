import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("Alexa+ simulation validates portfolio and cites findings with mock LLM", async ({ page }) => {
  await page.goto("/?sim=alexa");
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+ — not an Amazon product");
  await expect(page.getByLabel("Language model mode")).toContainText("deterministic mock");
  const chat = page.getByLabel("Alexa simulation chat");
  await page.getByLabel("Message Alexa simulation").fill("Validate the portfolio fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/runId/i)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/findingId/i)).toBeVisible({ timeout: 30_000 });
  const card = page.getByLabel("Findings list").getByRole("button", { name: /geometry\./ }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("featureId");
  const cards = page.getByLabel("Findings list").getByRole("button", { name: /(geometry|identifier)\./ });
  const listedCount = await cards.count();
  await page.getByLabel("Message Alexa simulation").fill("Explain the next finding.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/identifier\.duplicate/).last()).toBeVisible({ timeout: 30_000 });
  await expect(cards).toHaveCount(listedCount);
  const overflowing = await chat.locator("div > div").evaluateAll((bubbles) =>
    bubbles.filter((bubble) => bubble.scrollWidth > bubble.clientWidth + 1).length);
  expect(overflowing).toBe(0);
  await page.getByLabel("Message Alexa simulation").fill("Export QGIS.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText("The QGIS export is ready. Download the bundle from the simulation panel.")).toBeVisible({ timeout: 30_000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download last QGIS bundle" }).click();
  expect((await download).suggestedFilename()).toMatch(/^qgis-[a-f0-9]{8}\.zip$/);
});
