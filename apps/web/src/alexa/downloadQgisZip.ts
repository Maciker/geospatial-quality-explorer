import type { AlexaChatResponse } from "./alexaSimApi";
import { qgisBundleZip } from "./qgisZip";

/** One archive instead of four downloads: browsers block repeated downloads and QGIS needs the files side by side. */
export function downloadQgisArtifacts(response: AlexaChatResponse): void {
  const bundle = response.qgisExport;
  if (!bundle) {
    throw new Error("No QGIS bundle was returned. Ask Alexa to export QGIS first.");
  }
  const zip = qgisBundleZip(bundle);
  const url = URL.createObjectURL(new Blob([zip.bytes], { type: "application/zip" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = zip.fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
