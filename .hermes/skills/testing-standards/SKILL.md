---
name: testing-standards
description: Use when writing tests, reviewing test code, or working with test structure, naming, mocks, integration tests, or E2E tests, or when files match **/*.test.ts, **/*.integration.test.ts, **/*.e2e.test.ts.
---

# Testing Standards

Standards for writing clear, maintainable tests across all layers.

## FIRST Principles

- **Fast**: tests must run quickly; slow tests break the feedback loop.
- **Isolated**: each test is independent; no shared state or execution-order dependency.
- **Repeatable**: same result in any environment.
- **Self-validating**: clear pass/fail result; no manual inspection.
- **Timely**: written at the right time, before code in TDD.

## Test Pyramid

- **Many unit tests**: fast, isolated, edge cases.
- **Some integration tests**: real databases or real sandboxes.
- **Few E2E tests**: critical user journeys only.

## Naming

- Names in English.
- Names represent business rules, not implementation details.
- **Describe**: use `The [Subject]` format.
- **Test cases**: use domain language such as `calculates`, `validates`, `allows`; avoid technical verbs such as `returns`, `calls`, `throws`.

## Structure: AAA

- **Arrange**: prepare context and data.
- **Act**: execute the action.
- **Assert**: verify the expected result.
- Separate the three sections with blank lines.

## Mocks Policy

- Use in-memory repositories for use-case tests.
- Stubs and spies are allowed only on application ports such as token, email, payment, browser, Azure, or Key Vault gateway ports.
- Never mock repositories in use-case tests; use in-memory implementations.
- Before proposing another mock, consult the Technical Lead.

## Test Strategy by Layer

| Layer | Test Type | Dependencies | File Suffix |
|-------|-----------|--------------|-------------|
| Domain entities and value objects | Unit | None | `.test.ts` |
| Domain services | Unit | None | `.test.ts` |
| Use cases | Unit | In-memory repositories | `.test.ts` |
| Repository adapters | Integration | Real DB or sandbox | `.integration.test.ts` |
| External service adapters | Integration | Real test service or sandbox | `.integration.test.ts` |
| HTTP/UI flows | E2E | Full stack | `.e2e.test.ts` |

## Test Location

Default structure for app modules:

```text
src/[module-name]/tests/
  unit/
  integration/
  e2e/
```

Library packages may use `test/` when the project is intentionally small.

## Vitest Environment

- Vitest tests may use configured globals if the project opts into them.
- Do not fix missing Vitest global diagnostics by adding repeated imports across many files unless the project changes convention.
- Playwright E2E tests keep using Playwright's imported `test` and `expect` APIs.

## Commands

Use package scripts instead of vendor-specific direct commands:

```bash
pnpm test
pnpm coverage
pnpm quality:fast
```

## Non-Negotiable Rules

- Never delete an existing test to make a failure disappear.
- Never weaken a test to make the implementation pass.
- Never mock repositories in use-case tests.
- Never use mocks without a clear application-port boundary.
- Always use AAA structure with blank lines between sections.
- Always name tests as business rules.
- Always fix implementation when a valid test fails.
- Never use real secret values, tokens, cookies, client secrets, credentials, or copied secret values in tests, fixtures, snapshots, logs, or screenshots.

For full examples, see `references/testing-detail.md`.

## Behavior at stable interfaces

Choose a test interface that can expose the requirement or actual bug. Prefer outcomes visible to callers over private methods, call counts or copied implementation formulas. Expected values should come from a worked example, specification or independently known result.

Work one observable slice at a time. Avoid writing a batch of tests for an imagined internal design before implementing any behavior. A behavior-preserving refactor should usually keep these tests unchanged. Retain the existing layer-specific policy and Red–Green–Refactor cycle.

Adapted from Matt Pocock's `tdd`; see repository-root `THIRD_PARTY_NOTICES.md`.
