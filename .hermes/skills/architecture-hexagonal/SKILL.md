---
name: architecture-hexagonal
description: This skill should be used when creating modules, organizing code by layers, working with "hexagonal architecture", "ports and adapters", domain entities, value objects, repositories, use cases, DTOs, factory modules, HTTP controllers, or when deciding where code belongs, or when files match **/domain/**, **/application/**, **/infrastructure/**, **/factory.ts.
---

# Hexagonal Architecture

Code is organized by business modules (vertical slicing), not by technical layer. The directory structure screams the business domain: folders are named after business concepts such as `orders` or `invoices`, not technical layers such as `controllers` or `services`.

## Module Structure

```text
src/
  [module-name]/
    domain/           # Business core, no external dependencies
      entities/
      value-objects/
      services/
      repositories/   # Interface + InMemory implementation
    application/      # Use cases and ports for external services
      [UseCase].ts
      ports/
    infrastructure/   # Adapters and concrete implementations
      adapters/
      http/           # Primary port / driver
    tests/
      unit/
      integration/
      e2e/
```

## Layers and Responsibilities

### 1. Domain

- Entities: objects with identity and lifecycle.
- Value Objects: immutable objects defined by attributes.
- Domain Services: pure logic that does not belong to a specific entity.
- Repositories: interfaces plus InMemory implementations.
- DomainError: single error class with factory methods.
- No dependencies towards application or infrastructure.
- No frameworks or external libraries.

### 2. Application

- Use Cases orchestrate business logic.
- External Service Ports define interfaces for email, payments, notifications, cloud services, etc.
- Depends only on Domain.

### 3. Infrastructure

- Adapters implement ports.
- Controllers, handlers, CLI, events, database clients, browser clients, and framework code live here.
- Depends on Application and Domain.

## Dependency Rule

```text
Infrastructure -> Application -> Domain
```

Dependencies always point towards the center.

- Domain never imports from Application or Infrastructure.
- Application never imports from Infrastructure.
- Infrastructure may import Application and Domain.

## Ports and Adapters

Repositories live in Domain and define contracts around domain entities. InMemory implementations live next to the interface because they are the default test double for UseCase tests.

External service ports live in Application. Concrete implementations live in Infrastructure.

## Cross-Module Communication

Allowed imports from another module:

- Domain entities and value objects.
- Ports or repository interfaces.

Forbidden imports from another module:

- UseCases. A UseCase must never call another UseCase.

## Naming Conventions

| Layer | Allowed Suffixes |
|-------|------------------|
| Domain | Entity (implicit), ValueObject, DomainService, Repository |
| Application | UseCase, Service, DTO, Port |
| Infrastructure | Repository implementation, Adapter, Controller, Handler, Client |

- One file per class/interface.
- File name equals class name in PascalCase.

## Detailed Patterns by Layer

For an MCP server adapter, read `references/infrastructure/mcp-adapters.md`; it complements HTTP adapters without changing domain dependencies.

- Domain: `references/domain/entities.md`, `references/domain/value-objects.md`, `references/domain/repositories.md`, `references/domain/domain-services.md`
- Application: `references/application/usecases.md`, `references/application/dtos.md`
- Infrastructure: `references/infrastructure/factory.md`, `references/infrastructure/http-adapters.md`
- Structure: `references/module-structure.md`

## Boilerplate Decisions

- Default identifier pattern: use a generic `Id` value object. Use typed identifiers only when the project explicitly needs compile-time distinction.
- Domain services are stateless functions, not classes, unless the Tech Lead approves an exception.
- A plain static Factory is preferred over DI containers for explicit wiring.
- For TypeScript package/library projects, HTTP adapter rules are optional until an API surface exists.

## Non-Negotiable Rules

- Never import frameworks or libraries in Domain.
- Never import from Application or Infrastructure in Domain.
- Never import from Infrastructure in Application.
- Never import a UseCase from another module.
- Never put business logic in Infrastructure.
- Never create God classes such as `OrderManager` or `ProductHelper`.
- Always create a port interface before its adapter.
- Always keep Domain free of external dependencies.
- Always validate the dependency rule on every import.
- Always group code by business module, not by technical layer.
- Always consult the Tech Lead before creating a new module.
