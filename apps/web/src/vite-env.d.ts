/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `alexa-only` serves the Alexa+ simulation without the PostGIS review screen (hosted demo). */
  readonly VITE_APP_MODE?: string;
  /** Vector basemap style URL. Unset uses OpenFreeMap Positron; empty or `off` keeps the plain background. */
  readonly VITE_BASEMAP_STYLE_URL?: string;
}
