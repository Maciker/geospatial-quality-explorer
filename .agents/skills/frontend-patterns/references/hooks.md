# React Custom Hooks

## Separate Business Logic from Presentation

- **Hooks** = how things work (logic, state)
- **Components** = how things look (presentation)

## Context Only for Dependency Injection

`createContext` and `useContext` are allowed exclusively for providing use cases to store hooks. One context per vertical slice, located in `infrastructure/context/`.

```typescript
// Good - context delivers use cases to store hooks
const ctx = useContext(ProjectUseCasesContext);

// Bad - context for shared state
const ctx = useContext(ThemeStateContext); // Never
```

## Pass Dependencies as Parameters

For custom hooks that are NOT store hooks, pass use cases as parameters:

```typescript
// Good - dependency passed as parameter
export function useProfile(useCase: GetProfileUseCase) { ... }

// Bad - global dependency call
export function useProfile() {
  const useCase = Factory.createGetProfileUseCase(); // Never do this
}
```

Store hooks (`useModuleQuery`, `useModuleMutations`) obtain use cases from Context internally — see `references/store.md`.

## Dependency Boundaries

Hooks follow hexagonal architecture boundaries:

**Hooks CAN access:**
- **UseCases** (for async operations with side effects)
- **Pure domain functions** (for transformations, filters, validations)

**Hooks NEVER access:**
- Repositories directly
- `fetch` or HTTP APIs
- Infrastructure adapters
- Factory (except in root component to create use cases)

```typescript
// Good - hook calls UseCase
const loadProfile = async () => {
  const profile = await useCase.execute();
  setProfile(profile);
};

// Good - hook uses pure domain function
import { filterActiveUsers } from '../../domain/services/userFilters';
const activeUsers = filterActiveUsers(users);

// Bad - hook calls repository directly
const loadProfile = async () => {
  const profile = await repository.findById(id);
};

// Bad - hook uses fetch directly
const loadProfile = async () => {
  const response = await fetch('/api/profile');
};
```

## Only useState Inside Hooks

- No `useEffect` inside hooks (it belongs in the component)
- The hook only represents component behavior and state

## No Nested Functions

```typescript
// Good - arrow functions at first level
export function useProfile(useCase: GetProfileUseCase) {
  const [state, setState] = useState<ProfileState>(initialState);

  const startLoading = () => { ... };
  const setProfile = (profile: ProfileDTO) => { ... };
  const loadProfile = async () => { ... };

  return { ... };
}

// Bad - nested functions
export function useProfile(useCase: GetProfileUseCase) {
  const loadProfile = async () => {
    const handleSuccess = () => { ... };  // Never nest
    const handleError = () => { ... };    // Never nest
  };
}
```

## Single useState with Grouped State

```typescript
// Good - single useState with grouped state
interface ProfileState {
  profile: Maybe<ProfileDTO>;
  loading: boolean;
  error: Maybe<Error>;
}

const [state, setState] = useState<ProfileState>(initialState);

// Bad - multiple useState
const [profile, setProfile] = useState<ProfileDTO | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

## Encapsulate State and Updates

```typescript
// Good - encapsulated
return {
  profile: state.profile,
  loading: state.loading,
  error: state.error,
  loadProfile,
  updateName,
};

// Bad - exposed state and setter
return {
  state,        // Never expose raw state
  setState,     // Never expose setter
};
```

## Use Previous State When Updating

```typescript
// Good - using previous state
const startLoading = () => {
  setState(prev => ({ ...prev, loading: true, error: Maybe.none() }));
};

// Bad - using current state directly
const startLoading = () => {
  setState({ ...state, loading: true });  // May cause race conditions
};
```

## Complete Example

```typescript
import { useState } from 'react';
import { Maybe } from '../shared/domain/Maybe';
import { ProfileDTO } from '../../application/ProfileDTO';
import { GetProfileUseCase } from '../../application/GetProfileUseCase';

interface ProfileState {
  profile: Maybe<ProfileDTO>;
  loading: boolean;
  error: Maybe<Error>;
}

const initialState: ProfileState = {
  profile: Maybe.none(),
  loading: false,
  error: Maybe.none(),
};

export function useProfile(useCase: GetProfileUseCase) {
  const [state, setState] = useState<ProfileState>(initialState);

  const startLoading = () => {
    setState(prev => ({ ...prev, loading: true, error: Maybe.none() }));
  };

  const setProfile = (profile: ProfileDTO) => {
    setState(prev => ({ ...prev, profile: Maybe.some(profile), loading: false }));
  };

  const setError = (error: Error) => {
    setState(prev => ({ ...prev, error: Maybe.some(error), loading: false }));
  };

  const loadProfile = async () => {
    startLoading();
    try {
      const profile = await useCase.execute();
      setProfile(profile);
    } catch (error) {
      setError(error as Error);
    }
  };

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    loadProfile,
  };
}
```

## Consuming Hooks

- **No destructuring** hook results
- Use `hook.property` pattern for clarity

```typescript
// Bad - destructuring
const { profile, loading, loadProfile } = useProfile(useCase);

// Good - hook.property
const profileHook = useProfile(useCase);
// usage: profileHook.profile, profileHook.loading, profileHook.loadProfile()
```

## Allowed Hooks

| Hook | Where | Use |
|------|-------|-----|
| `useState` | Custom hooks | One per hook, grouped state |
| `useEffect` | Components | Lifecycle, NOT in hooks |
| `useRef` | Components | DOM references only |
| `useContext` | Store hooks | Dependency injection only (use cases from Context) |
| `useQuery` | Store hooks | Read operations with caching (`Module.queries.ts`) |
| `useMutation` | Store hooks | Write operations with cache invalidation (`Module.mutations.ts`) |
| `useQueryClient` | Store hooks | Cache invalidation in mutations |
| `useSearchParams` | Page components | URL-driven state |

## Prohibited Hooks

- `useMemo` / `useCallback` — premature optimization
- `useReducer` — useState is enough
- Any hook inside custom hooks except the single `useState`
- `useContext` outside store hooks — never for shared state

## State with Maybe

- Use `Maybe<T>` for optional values, never null
- Initial state uses `Maybe.none()` for optional fields

## File Naming

- `ComponentName.hook.ts` (e.g., `Profile.hook.ts`)
- `Module.queries.ts` (e.g., `Project.queries.ts`)
- `Module.mutations.ts` (e.g., `Project.mutations.ts`)
