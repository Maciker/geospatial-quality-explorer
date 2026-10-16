/** The E2E build points the app's basemap at this local URL so no third-party tile host is reached. */
const E2E_BASEMAP_ORIGIN = "http://127.0.0.1:4173";
export const E2E_BASEMAP_STYLE_URL = `${E2E_BASEMAP_ORIGIN}/__e2e/basemap-style.json`;
export const E2E_BASEMAP_TILES = `${E2E_BASEMAP_ORIGIN}/__e2e/tiles`;
