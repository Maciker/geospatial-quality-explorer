/**
 * Assert frozen Natural Earth artifacts match published SHA-256 digests
 * and that the didactic rebuild is byte-stable.
 *
 * Usage: pnpm --filter @gis/quality exec tsx scripts/verify-ne-admin0-hashes.ts
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const provenancePath = join(root, "fixtures/provenance/natural-earth-110m-admin0/PROVENANCE.md");
const demoErrorsPath = join(root, "fixtures/vector/ne-admin0-westeurope-demo-errors.geojson");

const EXPECTED: ReadonlyArray<{ relativePath: string; sha256: string }> = [
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
];

function sha256File(absolutePath: string): string {
  return createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
}

let failed = false;
for (const entry of EXPECTED) {
  const absolutePath = join(root, entry.relativePath);
  const actual = sha256File(absolutePath);
  if (actual !== entry.sha256) {
    failed = true;
    process.stderr.write(`${entry.relativePath}\n  expected ${entry.sha256}\n  actual   ${actual}\n`);
  }
}

const provenance = readFileSync(provenancePath, "utf8");
for (const entry of EXPECTED) {
  if (!provenance.includes(entry.sha256)) {
    failed = true;
    process.stderr.write(`PROVENANCE.md missing digest for ${entry.relativePath}\n`);
  }
}

const before = readFileSync(demoErrorsPath);
execFileSync(process.execPath, ["--import", "tsx", join(root, "scripts/build-ne-admin0-demo-errors.ts")], {
  cwd: root,
  stdio: "pipe",
});
const after = readFileSync(demoErrorsPath);
if (!before.equals(after)) {
  failed = true;
  process.stderr.write("build-ne-admin0-demo-errors.ts changed the frozen demo-errors GeoJSON\n");
  writeFileSync(demoErrorsPath, before);
}

if (failed) {
  process.exitCode = 1;
} else {
  process.stdout.write("ne-admin0 provenance hashes ok\n");
}
