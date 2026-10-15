import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { qgisBundleZip } from "./qgisZip";

const bundle = {
  runId: "a".repeat(64),
  files: {
    geojson: "{\"type\":\"FeatureCollection\",\"features\":[]}\n",
    metadata: "{\"reportVersion\":\"1.0.0\"}\n",
    project: "<qgis><datasource>./findings.geojson</datasource></qgis>\n",
    style: "<qgis styleCategories=\"Symbology\"/>\nñ\n",
  },
};

function writeZip(bytes: Uint8Array): string {
  const path = join(mkdtempSync(join(tmpdir(), "qgis-zip-")), "bundle.zip");
  writeFileSync(path, bytes);
  return path;
}

describe("qgisBundleZip", () => {
  it("names the archive after the run and uses the file names the project expects", () => {
    const zip = qgisBundleZip(bundle);

    expect(zip.fileName).toBe("qgis-aaaaaaaa.zip");
    const listing = spawnSync("unzip", ["-Z1", writeZip(zip.bytes)], { encoding: "utf8" });
    expect(listing.stdout.trim().split("\n").sort()).toEqual(["findings.geojson", "findings.qgs", "findings.qml", "run-metadata.json"]);
  });

  it("produces an archive that passes an integrity check with exact contents", () => {
    const path = writeZip(qgisBundleZip(bundle).bytes);

    const test = spawnSync("unzip", ["-t", path], { encoding: "utf8" });
    const style = spawnSync("unzip", ["-p", path, "findings.qml"], { encoding: "utf8" });

    expect(test.status).toBe(0);
    expect(style.stdout).toBe(bundle.files.style);
  });
});
