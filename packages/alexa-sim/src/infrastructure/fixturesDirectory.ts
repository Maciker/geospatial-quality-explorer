import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function defaultVectorFixturesDirectory(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../../quality/fixtures/vector");
}
