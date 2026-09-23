import fs from "node:fs";
import { extractJson } from "../../lib/json.mjs";

const DEFAULT_QA_REVIEW = {
  score: 100,
  decision: "pass",
  summary: "Mock cross-model QA review. No real model was called.",
  blocking_findings: [],
  missing_tests: [],
  non_blocking_findings: [],
  confidence: "low",
};

/**
 * Offline adapter for tests and --dry-run. It never performs network I/O.
 * Provide a canned response via config.mockResponse (string) or AI_MOCK_RESPONSE
 * (inline string or a path to a file). Defaults to a passing QA review.
 */
export function createMockAdapter(config = {}) {
  return {
    name: config.providerName ?? "mock",
    async complete(request) {
      let text = config.mockResponse ?? process.env.AI_MOCK_RESPONSE;
      if (text && fs.existsSync(text)) text = fs.readFileSync(text, "utf8");
      if (!text) text = JSON.stringify(DEFAULT_QA_REVIEW);

      const wantsJson = Boolean(request.responseSchema || request.jsonObjectMode);
      return {
        text,
        json: wantsJson ? extractJson(text) : undefined,
        toolCalls: [],
        usage: { mock: true },
        raw: { mock: true, request: { model: request.model ?? config.model } },
      };
    },
  };
}
