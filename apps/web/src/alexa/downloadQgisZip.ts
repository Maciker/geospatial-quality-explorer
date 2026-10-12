import type { AlexaChatResponse } from "./alexaSimApi";

export function downloadQgisArtifacts(response: AlexaChatResponse): void {
  const bundle = response.qgisExport;
  if (!bundle) {
    throw new Error("No QGIS bundle was returned. Ask Alexa to export QGIS first.");
  }
  const files = [
    ["findings.geojson", bundle.files.geojson],
    ["metadata.json", bundle.files.metadata],
    ["project.qgs", bundle.files.project],
    ["style.qml", bundle.files.style],
  ] as const;
  for (const [name, content] of files) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${bundle.runId.slice(0, 8)}-${name}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
