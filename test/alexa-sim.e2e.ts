import { expect, test } from "@playwright/test";
import { readNanLlmConfig } from "../packages/alexa-sim/src/infrastructure/readNanLlmConfig.js";

test.beforeAll(() => {
  expect(readNanLlmConfig().useMockLlm).toBe(true);
});

test("Alexa+ simulation validates portfolio and cites findings with mock LLM", async ({ page }) => {
  await page.goto("/?sim=alexa");
  await expect(page.getByRole("note")).toContainText("Simulation of Alexa+ — not an Amazon product");
  const chat = page.getByLabel("Alexa simulation chat");
  await page.getByLabel("Message Alexa simulation").fill("Validate the portfolio fixture.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/runId/i)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Message Alexa simulation").fill("List the findings.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(/findingId/i)).toBeVisible({ timeout: 30_000 });
  const card = page.getByLabel("Finding cards and map").getByRole("button", { name: /geometry\./ }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("featureId");
});
