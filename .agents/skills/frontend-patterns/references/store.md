# Store Layer (React Query)

The store layer bridges use cases and components. It lives in `infrastructure/store/` and encapsulates all React Query internals behind domain-meaningful APIs.

## Structure

```
[module]/
  infrastructure/
    context/
      ModuleUseCases.context.ts    # Context for DI
    store/
      Module.queries.ts            # Read operations (useQuery)
      Module.mutations.ts          # Write operations (useMutation)
```

## Context for Dependency Injection

One context per vertical slice. The context provides use cases to store hooks without coupling them to Factory.

```typescript
// infrastructure/context/ProjectUseCases.context.ts
import { createContext, useContext } from 'react';
import type { ListProjectsUseCase } from '../../application/ListProjectsUseCase';
import type { RegisterProjectUseCase } from '../../application/RegisterProjectUseCase';

export interface ProjectUseCases {
  list: ListProjectsUseCase;
  register: RegisterProjectUseCase;
}

const ProjectUseCasesContext = createContext<ProjectUseCases | null>(null);

export const ProjectUseCasesProvider = ProjectUseCasesContext.Provider;

export function useProjectUseCases(): ProjectUseCases {
  const ctx = useContext(ProjectUseCasesContext);
  if (!ctx) throw new Error('Missing ProjectUseCasesProvider');
  return ctx;
}
```

### Rules

- One context file per module that needs store hooks
- Interface lists all use cases the module needs
- `useModuleUseCases()` throws if provider is missing (fail-fast)
- Export the Provider (for wiring) and the hook (for store hooks)

## AppProviders

All contexts compose in a single `AppProviders` component. This is the only place where providers nest.

```typescript
// shared/infrastructure/ui/AppProviders.tsx
interface Props {
  projectUseCases: ProjectUseCases;
  filesystemUseCases: FilesystemUseCases;
  children: ReactNode;
}

export function AppProviders(props: Props) {
  return (
    <ProjectUseCasesProvider value={props.projectUseCases}>
      <FilesystemUseCasesProvider value={props.filesystemUseCases}>
        {props.children}
      </FilesystemUseCasesProvider>
    </ProjectUseCasesProvider>
  );
}
```

## Queries

Encapsulate `useQuery` and expose domain-meaningful functions. Never leak React Query internals (`data`, `isError`, `isSuccess`, `error`).

```typescript
// infrastructure/store/Project.queries.ts
import { useQuery } from '@tanstack/react-query';
import { Maybe } from '@app/common/src/domain/Maybe';
import { useProjectUseCases } from '../context/ProjectUseCases.context';

export const projectsKey = ['projects'];

export function useProjectsQuery() {
  const useCases = useProjectUseCases();
  const query = useQuery({
    queryKey: projectsKey,
    queryFn: () => useCases.list.execute(),
  });

  const projects = () => query.data ?? [];
  const hasProjects = () => projects().length > 0;
  const firstProjectId = () => Maybe.fromNullable(projects()[0]?.id);
  const findById = (id: string) => Maybe.fromNullable(projects().find((p) => p.id === id));
  const containsId = (id: string) => projects().some((p) => p.id === id);
  const errorMessage = () => (query.error instanceof Error ? query.error.message : '');

  const resolveSelectedId = (selectedId: Maybe<string>): Maybe<string> => {
    const validId = selectedId.flatMap((id) =>
      containsId(id) ? Maybe.some(id) : Maybe.none<string>()
    );
    return validId.isSome() ? validId : firstProjectId();
  };

  return {
    isLoading: query.isLoading,
    projects,
    hasProjects,
    findById,
    containsId,
    errorMessage,
    resolveSelectedId,
  };
}
```

### Rules

- One `useModuleQuery()` per module
- Obtain use cases from Context via `useModuleUseCases()`
- Wrap raw data in helper functions (`projects()`, `hasProjects()`, `findById()`)
- Use `Maybe<T>` for optional lookups, not `null`/`undefined`
- Export the query key constant for cache invalidation in mutations
- Never expose `query.data`, `query.error`, `query.isSuccess` directly

## Mutations

Encapsulate `useMutation` and handle cache invalidation.

```typescript
// infrastructure/store/Project.mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjectUseCases } from '../context/ProjectUseCases.context';
import { projectsKey } from './Project.queries';

export function useProjectMutations() {
  const useCases = useProjectUseCases();
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: projectsKey });

  const register = useMutation({
    mutationFn: ({ name, path }: { name: string; path: string }) =>
      useCases.register.execute(name, path),
    onSuccess,
  });

  const unregister = useMutation({
    mutationFn: (id: string) => useCases.unregister.execute(id),
    onSuccess,
  });

  return { register, unregister };
}
```

### Rules

- One `useModuleMutations()` per module
- Obtain use cases from Context via `useModuleUseCases()`
- Invalidate the module's query key on success
- Each mutation is a named property (`.register`, `.unregister`)
- Components call `mutations.register.mutate(...)` or `mutations.register.mutateAsync(...)`

## Consuming Store Hooks in Components

Components use store hooks directly — no props for use cases needed.

```typescript
export function ProjectTabs(props: Props) {
  const projectsQuery = useProjectsQuery();
  const projectMutations = useProjectMutations();

  if (projectsQuery.isLoading) {
    return <span>Loading...</span>;
  }

  // Use domain helpers, not raw data
  if (!projectsQuery.hasProjects()) {
    return <span>No projects</span>;
  }

  return projectsQuery.projects().map((p) => <Tab key={p.id} project={p} />);
}
```

### Rules

- No destructuring: `projectsQuery.isLoading`, not `{ isLoading }`
- Use the query's domain helpers (`hasProjects()`, `findById()`)
- Components never import or call use cases directly
- Components never touch Factory

## Dependency Flow

```
Factory → AppProviders → Context → Store hooks → Components
           (wiring)      (DI)      (caching)     (presentation)
```

- **Factory**: creates use case instances (infrastructure)
- **AppProviders**: wires use cases into Context providers (composition root)
- **Context**: delivers use cases to store hooks (dependency injection)
- **Store hooks**: wrap React Query around use cases (caching + domain API)
- **Components**: consume store hooks for data and mutations (presentation)
