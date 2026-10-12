import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("Alexa+ simulation validates portfolio and cites findings with mock LLM", async ({ page }) => {
  await page.goto("/?sim=alexa");
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+ — not an Amazon product");
  await page.getByLabel("Message Alexa simulation").fill("Validate the portfolio fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/runId/i)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/findingId/i)).toBeVisible({ timeout: 30_000 });
  const card = page.locator("button").filter({ hasText: "geometry" }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("featureId");
});
