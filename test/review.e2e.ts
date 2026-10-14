import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

function storedRunId(): string {
  return readFileSync("/tmp/geospatial-quality-explorer-run-id", "utf8").trim();
}

test("reviews stored findings and reports an unknown run", async ({ page }) => {
  await page.goto(`/?run=${storedRunId()}`);
  await expect(page.getByLabel("Run provenance")).toContainText("portfolio");
  await expect(page.getByLabel("Run provenance")).toContainText("vector-core 1.1.0");
  await expect(page.getByLabel("Findings map").locator("canvas")).toBeVisible();
  const finding = page.getByRole("button", { name: /geometry\.invalid/ });
  await finding.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Finding detail")).toContainText("self-intersects");
  await page.getByLabel("Severity").selectOption("warning");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No findings match these filters.")).toBeVisible();
  await page.goto(`/?run=${"ab".repeat(32)}`);
  await expect(page.getByRole("alert")).toContainText("unknown");
});

test("imports a local GeoJSON file from the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Choose a completed run")).toBeVisible();
  await page.getByLabel("GeoJSON file").setInputFiles("packages/quality/fixtures/vector/empty-geometry.geojson");
  await page.getByRole("button", { name: "Start import" }).click();
  await expect(page.getByText(/is succeeded/)).toBeVisible();
  await page.getByRole("button", { name: "Open imported run" }).click();
  await page.getByRole("button", { name: /geometry\.empty/ }).click();
  await expect(page.getByLabel("Finding detail")).toContainText("No geometry is stored for this finding.");
});

test("keeps the finding list usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/?run=${storedRunId()}`);
  const finding = page.getByRole("button", { name: /geometry\.empty/ });
  await expect(finding).toBeVisible();
  const box = await finding.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(375);
});
