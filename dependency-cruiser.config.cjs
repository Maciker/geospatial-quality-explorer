/**
 * Hexagonal architecture rules. The canonical reference is
 * .ai/skills/architecture-hexagonal. Dependency direction:
 * Infrastructure -> Application -> Domain.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make modules impossible to reason about and test in isolation.",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-stays-pure",
      severity: "error",
      comment: "Domain must not depend on Application or Infrastructure.",
      from: { path: "(^|/)domain/" },
      to: { path: "(^|/)(application|infrastructure)/" },
    },
    {
      name: "application-no-infrastructure",
      severity: "error",
      comment: "Application must not depend on Infrastructure. Depend on ports, not adapters.",
      from: { path: "(^|/)application/" },
      to: { path: "(^|/)infrastructure/" },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Orphan modules are usually dead code or a missing wiring.",
      from: { orphan: true, pathNot: ["\\.d\\.ts$", "(^|/)index\\.ts$", "(^|/)vite\\.config\\.ts$"] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(node_modules|dist|\\.quality|/tests?/)" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs"],
    },
  },
};
