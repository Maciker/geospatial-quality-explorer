export type AppMode = "review" | "alexa";

/**
 * The hosted demo has no PostGIS-backed review API, so an `alexa-only` build
 * (VITE_APP_MODE) serves the simulation alone instead of a review screen that cannot load.
 */
export function resolveAppMode(search: string, buildMode: string | undefined): { mode: AppMode; canSwitch: boolean } {
  if (buildMode === "alexa-only") return { mode: "alexa", canSwitch: false };
  const params = new URLSearchParams(search);
  return { mode: params.get("sim") === "alexa" ? "alexa" : "review", canSwitch: true };
}
