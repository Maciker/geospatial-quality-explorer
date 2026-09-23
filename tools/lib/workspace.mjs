import fs from "node:fs";
import path from "node:path";

const AI_DIR_CANDIDATES = [".ai", "ai"];

export function resolveAiDir(root = process.cwd()) {
  for (const candidate of AI_DIR_CANDIDATES) {
    if (fs.existsSync(path.join(root, candidate))) return candidate;
  }
  return AI_DIR_CANDIDATES[0];
}

export function aiPath(relative, root = process.cwd()) {
  return path.join(root, resolveAiDir(root), relative);
}

export function workspacePath(relative, root = process.cwd()) {
  return aiPath(path.join("workspace", relative), root);
}

export function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
}
