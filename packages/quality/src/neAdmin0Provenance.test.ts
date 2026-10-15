import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const qualityRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED = [
  {
    relativePath: "fixtures/provenance/natural-earth-110m-admin0/ne_110m_admin_0_countries.zip",
    sha256: "0f243aeac8ac6cf26f0417285b0bd33ac47f1b5bdb719fd3e0df37d03ea37110",
  },
  {
    relativePath: "fixtures/vector/ne-admin0-westeurope.geojson",
    sha256: "389d16699cad09d128943dfffc63e616f6e2e7b4c6987698be14a6671a9aeb08",
  },
  {
    relativePath: "fixtures/vector/ne-admin0-westeurope-demo-errors.geojson",
    sha256: "bfe80be1c8f795a81f429fab62a2dc94ba9c43f61e466d9322e4718d28c8b4a6",
  },
] as const;

describe("Natural Earth Admin 0 provenance", () => {
  it("keeps frozen zip and catalog GeoJSON digests aligned with PROVENANCE.md", () => {
    const provenance = readFileSync(
      join(qualityRoot, "fixtures/provenance/natural-earth-110m-admin0/PROVENANCE.md"),
      "utf8",
    );
    for (const entry of EXPECTED) {
      const bytes = readFileSync(join(qualityRoot, entry.relativePath));
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(digest).toBe(entry.sha256);
      expect(provenance).toContain(entry.sha256);
    }
  });

  it("rebuilds the didactic error variant without changing frozen bytes", () => {
    const demoPath = join(qualityRoot, "fixtures/vector/ne-admin0-westeurope-demo-errors.geojson");
    const before = readFileSync(demoPath);
    execFileSync(process.execPath, ["--import", "tsx", join(qualityRoot, "scripts/build-ne-admin0-demo-errors.ts")], {
      cwd: qualityRoot,
      stdio: "pipe",
    });
    const after = readFileSync(demoPath);
    if (!before.equals(after)) {
      writeFileSync(demoPath, before);
    }
    expect(after.equals(before)).toBe(true);
  });
});
