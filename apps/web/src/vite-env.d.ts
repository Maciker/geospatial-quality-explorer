/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `alexa-only` serves the Alexa+ simulation without the PostGIS review screen (hosted demo). */
  readonly VITE_APP_MODE?: string;
  /** Vector basemap style URL. Unset uses OpenFreeMap Positron; empty or `off` keeps the plain background. */
  readonly VITE_BASEMAP_STYLE_URL?: string;
  /** `1` makes the map expose `data-drawn-findings` for E2E tests. Never set in production builds. */
  readonly VITE_MAP_TEST_HOOKS?: string;
}
