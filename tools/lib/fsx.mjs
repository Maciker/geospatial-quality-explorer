import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Root-relative filesystem helpers shared by the vendor/stabilization checks.
export function fsHelpers(root = process.cwd()) {
  const read = (target) => readFileSync(join(root, target), "utf8");
  const relativeFromRoot = (target) => relative(root, target).replaceAll("\\", "/");
  const listFiles = (dir, suffix) => {
    const full = join(root, dir);
    if (!existsSync(full)) return [];
    return readdirSync(full)
      .map((entry) => join(full, entry))
      .filter((target) => statSync(target).isFile() && target.endsWith(suffix))
      .sort();
  };
  return { read, relativeFromRoot, listFiles };
}
