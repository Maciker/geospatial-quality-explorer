# Frontend Profile

The frontend profile is optional. It is useful for React projects that want strict component, hook, store, and CSS Modules conventions.

## Enable when

The repository or task includes:

```text
*.tsx
*.hook.ts
*.module.css
infrastructure/store/*.ts
infrastructure/context/*.ts
```

## Adds

```text
.ai/skills/frontend-patterns/
.ai/agents/frontend-reviewer.md
.ai/agents/ux-reviewer.md
.ai/commands/frontend-review.md
.ai/commands/ux-review.md
quality/profiles/react.md
```

## Main rules

- Components use `props.x`, not destructured props.
- Hooks expose `hook.property`, not destructured hook results.
- `useEffect` lives in components, not custom hooks.
- Store hooks wrap React Query and expose domain helpers.
- Context is dependency injection only.
- CSS Modules only, imported as `styles`.
- No Tailwind or utility CSS frameworks under this profile.

## Warning

This profile is intentionally opinionated. Keep it optional in a general TypeScript boilerplate.
