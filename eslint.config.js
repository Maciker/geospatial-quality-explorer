import js from "@eslint/js";
import tseslint from "typescript-eslint";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  fetch: "readonly",
  URL: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
};

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      ".quality/**",
      ".sandbox/**",
      "**/workspace/**",
      // Generated vendor projections (both dot and non-dot checkouts).
      // Edit .ai/ and run pnpm ai:sync instead of editing these.
      ".cursor/**",
      "cursor/**",
      ".github/prompts/**",
      ".github/instructions/**",
      "github/prompts/**",
      "github/instructions/**",
      ".codex/**",
      "codex/**",
      ".hermes/**",
      "hermes/**",
      ".agents/**",
      "agents/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["packages/**/*.ts", "apps/api/**/*.ts", "apps/cli/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: nodeGlobals,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...nodeGlobals, module: "writable", require: "readonly", exports: "writable" },
    },
  },
);
