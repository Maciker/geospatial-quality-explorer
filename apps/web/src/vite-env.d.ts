/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `alexa-only` serves the Alexa+ simulation without the PostGIS review screen (hosted demo). */
  readonly VITE_APP_MODE?: string;
}
