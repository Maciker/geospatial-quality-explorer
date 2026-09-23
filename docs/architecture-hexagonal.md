# Hexagonal Architecture

This boilerplate uses business-module slicing with hexagonal boundaries.

```text
src/[module]/domain
src/[module]/application
src/[module]/infrastructure
src/[module]/tests
```

## Dependency Direction

```text
Infrastructure -> Application -> Domain
```

Domain never imports application, infrastructure, frameworks, SDKs, HTTP, database clients, or browser APIs. Application depends only on domain. Infrastructure contains adapters, controllers, handlers, clients, and wiring.

## Main Rules

- Group code by business module, not by technical layer.
- Use one UseCase per behavior with a single `execute()` entry point.
- Repositories are domain ports and return domain entities.
- InMemory repositories live next to repository interfaces for UseCase tests.
- External service ports live in application.
- Concrete adapters live in infrastructure.
- Use a plain Factory for dependency wiring.
- UseCases must not call UseCases from other modules.

## Validation

Run:

```bash
pnpm arch
pnpm quality:full
```

The architecture rules are configured in `dependency-cruiser.config.cjs`.

See `.ai/skills/architecture-hexagonal/SKILL.md` for the operational agent rules.
