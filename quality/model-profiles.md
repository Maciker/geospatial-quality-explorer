# Model profiles

This file documents intent, not a vendor-specific configuration.

## default

Use the team's default coding model.

## planner

Prefer a reasoning-heavy model. Tools should be read-only.

## executor

Prefer a reliable coding model with shell access. Must follow TDD.

## reviewer

Prefer a different model or fresh context from the executor when possible.

## qa-cross-model

Must not reuse the executor context. The goal is independent review.
