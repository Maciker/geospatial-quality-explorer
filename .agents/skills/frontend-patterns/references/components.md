# React Components

## Props

- **No destructuring**: use `props.x`, not `{ x }`
- Props interface defined above component function
- Use explicit interface, not inline type

```typescript
interface Props {
  useCase: HealthUseCase;
}

export function Health(props: Props) {
  const hook = useHealth(props.useCase);
  // ...
}
```

## useEffect

- useEffect lives in the **component**, not in hooks
- Trigger hook action functions from useEffect
- Dependencies should include the action function from the hook

```typescript
export function Health(props: Props) {
  const hook = useHealth(props.useCase);

  useEffect(() => {
    hook.fetch();
  }, [hook.fetch]);

  // ...
}
```

## Maybe Handling

- Use `state.value.isSome()` for conditionals
- Use `state.value.fold()` for rendering different states
- Use `state.value.getOrThrow()` only when `isSome()` is already checked

```typescript
if (hook.error.isSome()) {
  return (
    <div className={styles.error}>
      Error: {hook.error.getOrThrow().message}
    </div>
  );
}

return hook.health.fold(
  () => <div className={styles.empty}>No health data</div>,
  (health) => (
    <div className={styles.container}>
      <span className={health.isHealthy ? styles.healthy : styles.unhealthy}>
        {health.status}
      </span>
    </div>
  )
);
```

## Styling

- CSS Modules only
- File naming: `ComponentName.module.css`
- Import as `styles`

```typescript
import styles from './Health.module.css';
```

## File Structure

- Each component in its own folder: `ComponentName/ComponentName.tsx` + `ComponentName.module.css`
- Related sub-components live in the same file (private functions, not exported)

```
infrastructure/ui/
  NavBar/
    NavBar.tsx
    NavBar.module.css
  ProjectTabs/
    ProjectTabs.tsx
    ProjectTabs.module.css
```

## Wiring Patterns

There are two patterns for connecting components to their dependencies. Choose based on whether the module uses the store layer.

### Container Pattern (simple modules)

For modules without React Query / store layer. Component receives use cases via props; Container uses Factory to create them.

```typescript
// Health.page.tsx
import { Factory } from '../../../../shared/infrastructure/factory';

interface Props {
  useCase: HealthUseCase;
}

// Presentational component (testable)
export function Health(props: Props) {
  const hook = useHealth(props.useCase);

  useEffect(() => {
    hook.loadHealthStatus();
  }, [hook.loadHealthStatus]);

  return hook.health.fold(
    () => <div className={styles.empty}>No health data</div>,
    (health) => <div className={styles.status}>{health.status}</div>
  );
}

// Container (uses Factory, for routes)
export function HealthContainer() {
  const useCase = Factory.createHealthUseCase();
  return <Health useCase={useCase} />;
}
```

| Export | Use | Testable |
|--------|-----|----------|
| `Health` | Component tests | Yes (receives UseCase via props) |
| `HealthContainer` | Routes, App | No (uses Factory, test via E2E) |

### Wired Page Pattern (modules with store)

For modules that use React Query store hooks. The WiredPage uses Factory to create use cases and injects them via AppProviders. The page component consumes data through store hooks, not props.

```typescript
// Dashboard.page.tsx (wiring — not testable, for routes only)
import { Factory } from '../../../../shared/infrastructure/factory';
import { AppProviders } from '../../../../shared/infrastructure/ui/AppProviders';

export function DashboardWiredPage() {
  return (
    <AppProviders
      projectUseCases={{
        list: Factory.createListProjectsUseCase(),
        register: Factory.createRegisterProjectUseCase(),
      }}
      filesystemUseCases={{
        browse: Factory.createBrowseDirectoriesUseCase(),
      }}
    >
      <DashboardPage
        listSessionsUseCase={Factory.createListSessionsUseCase()}
        connectionManager={Factory.createTerminalConnectionManager()}
      />
    </AppProviders>
  );
}

// DashboardPage.tsx (testable — receives only non-store deps via props)
export function DashboardPage(props: Props) {
  // Store hooks get use cases from Context automatically
  const projectsQuery = useProjectsQuery();
  const projectMutations = useProjectMutations();

  // Non-store deps still come via props
  // ...
}
```

| Export | Use | Testable |
|--------|-----|----------|
| `DashboardPage` | Component tests (wrap in AppProviders with InMemory repos) | Yes |
| `DashboardWiredPage` | Routes, App | No (uses Factory, test via E2E) |

### When to use each

| Criteria | Container Pattern | Wired Page Pattern |
|----------|-------------------|--------------------|
| Caching needed | No | Yes (React Query) |
| Multiple mutations | No | Yes |
| Store layer exists | No | Yes (`Module.queries.ts` / `Module.mutations.ts`) |
| Example module | Health | Project, Session |

### In routes

```typescript
<Route path="/health" element={<HealthContainer />} />
<Route path="/" element={<DashboardWiredPage />} />
```
