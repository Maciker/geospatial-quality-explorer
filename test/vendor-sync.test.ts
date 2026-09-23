import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const fixtures: string[] = [];
afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("vendor MCP synchronization", () => {
  it("projects canonical MCP settings into Cursor and Codex without hardcoded versions", () => {
    const directory = mkdtempSync(join(tmpdir(), "workflow-vendor-test-"));
    fixtures.push(directory);
    cpSync(".ai", join(directory, ".ai"), { recursive: true });
    cpSync("AGENTS.md", join(directory, "AGENTS.md"));
    const config = {
      mcpServers: {
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp@1.2.3"],
          env: { CONTEXT7_API_KEY: "${CONTEXT7_API_KEY}" },
        },
        playwright: {
          command: "npx",
          args: ["-y", "@playwright/mcp@0.0.42", "--isolated"],
        },
      },
    };
    writeFileSync(join(directory, ".ai/mcp.json"), JSON.stringify(config));

    execFileSync(process.execPath, [resolve("tools/vendors/sync-vendors.mjs")], {
      cwd: directory,
      stdio: "pipe",
    });

    const cursor = JSON.parse(readFileSync(join(directory, ".cursor/mcp.json"), "utf8"));
    const codex = readFileSync(join(directory, ".codex/config.toml"), "utf8");
    expect(cursor).toEqual(config);
    expect(codex).toContain('args = ["-y", "@upstash/context7-mcp@1.2.3"]');
    expect(codex).toContain('args = ["-y", "@playwright/mcp@0.0.42", "--isolated"]');
    expect(codex).toContain('CONTEXT7_API_KEY = "${CONTEXT7_API_KEY}"');
    expect(codex).not.toContain("@latest");
  });
});
