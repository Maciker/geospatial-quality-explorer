---
name: frontend-patterns
description: Optional React profile. Use when working with React components, custom hooks, CSS Modules, or store hooks with React Query, or when files match **/*.tsx, **/*.hook.ts, **/*.module.css, **/store/*.ts, **/context/*.ts.
---

# Frontend Patterns

React component standards, custom hooks rules, store layer patterns, and CSS Modules styling guidelines.

This is an optional profile. Do not apply it to non-React packages or teams that intentionally use Tailwind, reducers, global state libraries, or different component conventions.

## React Components

### Props

- No destructuring: use `props.x`, not `{ x }`.
- Define a `Props` interface above the component.
- Use explicit interfaces, not inline types.

### useEffect

- `useEffect` lives in the component, not in custom hooks.
- Trigger hook action functions from `useEffect`.
- Dependencies include the action function from the hook.

### Maybe Handling

- Use `state.value.isSome()` for conditionals.
- Use `state.value.fold()` for rendering alternate states.
- Use `state.value.getOrThrow()` only after `isSome()` has been checked.

### Wiring Patterns

| Pattern | When | Example |
|---------|------|---------|
| Container | Simple module without caching | `HealthContainer` uses Factory and passes use case through props |
| Wired Page | Module with React Query store | `DashboardWiredPage` uses Factory + AppProviders; page uses store hooks |

For full component patterns, see `references/components.md`.

## Store Layer

The store layer encapsulates React Query behind domain-meaningful APIs.

- `Module.queries.ts`: wraps `useQuery`, exposes domain helpers, never raw React Query internals.
- `Module.mutations.ts`: wraps `useMutation` and handles cache invalidation.
- `infrastructure/context/ModuleUseCases.context.ts`: one context per vertical slice for dependency injection.
- `shared/infrastructure/ui/AppProviders.tsx`: composes all context providers.

Dependency flow:

```text
Factory -> AppProviders -> Context -> Store hooks -> Components
```

For full store patterns, see `references/store.md`.

## Custom Hooks

- Hooks describe behavior and state; components describe presentation.
- Context is only for dependency injection into store hooks.
- Non-store hooks receive use cases as parameters.
- Only one grouped `useState` inside custom hooks.
- No `useEffect` inside custom hooks.
- No nested functions in hooks.
- Never expose raw state or setters.
- Always update with `setState(prev => ...)`.
- Consumers use `hook.property`, not destructuring.

Allowed hooks by default:

| Hook | Where | Use |
|------|-------|-----|
| `useState` | Custom hooks | One grouped state object |
| `useEffect` | Components | Lifecycle |
| `useRef` | Components | DOM references |
| `useContext` | Store hooks | Dependency injection only |
| `useQuery` | Store hooks | Read operations with caching |
| `useMutation` | Store hooks | Write operations and invalidation |
| `useQueryClient` | Store hooks | Cache invalidation |
| `useSearchParams` | Page components | URL-driven state |

Prohibited by this profile: `useMemo`, `useCallback`, `useReducer`, and Context for shared state.

For full hook rules, see `references/hooks.md`.

## CSS Modules

- CSS Modules only, import as `styles`.
- File naming: `ComponentName.module.css`.
- One `.module.css` file per component.
- Flexbox first; grid only for truly 2D layouts.
- No utility CSS frameworks, preprocessors, `!important`, inline styles, or global CSS except resets/variables.
- One class per element; compose in CSS with `composes`.
- Use `rem` for spacing and font sizes.
- Use CSS variables for colors and theming.
- Keep focus-visible states accessible.

For full CSS rules, see `references/css-modules.md`.

## Non-Negotiable Rules

- Never destructure props or hook results.
- Never put `useEffect` inside custom hooks.
- Never use Context API for state management.
- Never expose React Query internals from store hooks.
- Never import Factory or use cases directly in components when store hooks exist.
- Never use Tailwind, Bootstrap, or utility frameworks under this profile.
- Never hardcode colors; use CSS variables.
- Always access props via `props.x`.
- Always use CSS Modules for styling.
- Always use store hooks for modules with caching needs.
