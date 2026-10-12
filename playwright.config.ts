import { defineConfig } from "@playwright/test";

const databaseUrl = process.env.GEOSPATIAL_POSTGIS_URL
  ?? "postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer";

export default defineConfig({
  testDir: "test",
  testMatch: "*.e2e.ts",
  timeout: 60_000,
  globalSetup: "./test/global-setup.ts",
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: [
    {
      command: "pnpm exec tsx apps/api/src/main.ts",
      url: "http://127.0.0.1:8000/health",
      timeout: 60_000,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: "8000",
        GEOSPATIAL_POSTGIS_URL: databaseUrl,
        ALEXA_SIM_MOCK_LLM: "deterministic",
      },
    },
    {
      command: "pnpm --filter geospatial-quality-explorer-web build && pnpm --filter geospatial-quality-explorer-web exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      timeout: 60_000,
    },
  ],
});
