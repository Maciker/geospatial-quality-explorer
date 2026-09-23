# Testing Standards

## Test Pyramid

```text
        /\
       /  \      E2E (few)
      /----\     - Full HTTP flows
     /      \    - Critical paths only
    /--------\   Integration (some)
   /          \  - Repository adapters
  /------------\ - External service adapters
 /              \
/----------------\ Unit (many)
                   - Domain entities, VOs, services
                   - UseCases with InMemoryRepositories
```

- **More unit tests**: Fast, isolated, cover all edge cases
- **Some integration tests**: Real DB, real sandboxes
- **Few E2E tests**: Critical user journeys only

## Test Location

Tests live inside each module:

```text
src/[module-name]/tests/
  unit/              # Fast, no external dependencies
  integration/       # Real DB (PGlite for PostgreSQL)
  e2e/               # Full HTTP stack
```

## Parallelization

- **Unit tests**: Always run in parallel
- **Integration tests**: Run in parallel with isolated DB instances
- **E2E tests**: Run sequentially or with isolated test databases

## FIRST Principles

- **Fast**: Tests must run quickly. Slow tests break the feedback loop
- **Isolated**: Each test is independent. No shared state, no execution order dependency
- **Repeatable**: Same result every time, in any environment
- **Self-validating**: Clear pass/fail result. No manual inspection needed
- **Timely**: Written at the right time (before code in TDD)

## Naming

- Names in English
- Represent business rules, not implementation details
- Descriptive: what is being tested and what is expected
- Avoid technical names or names coupled to implementation

### Describe blocks

- Use "The [Subject]" format to identify the component/module being tested

### Test cases

- Write tests as business rules, not technical assertions
- Avoid technical verbs: "returns", "should return", "calls", "throws"
- Use domain language: "considers", "validates", "accepts", "allows", "calculates"

```typescript
describe('The Invoice Calculator', () => {
  it('applies a 10% discount for orders above 100', () => { ... });
  it('does not allow negative quantities', () => { ... });
});
```

## AAA Structure

- **Arrange**: Prepare context and necessary data
- **Act**: Execute the action to test
- **Assert**: Verify the expected result
- Visually separate the three sections with a blank line between them

## Mocks Policy

- Use InMemoryRepositories for UseCase tests (see the `architecture-hexagonal` skill)
- Stubs and spies are allowed on application ports such as token, email, Azure, and Key Vault gateway ports
- Never use mocks on repositories; always use InMemory implementations
- Before proposing any other mock: consult the Tech Lead first

## Examples

```typescript
// WORSE - Coupled to implementation
test('calculatePrice returns 90', () => {
  const result = calculatePrice(100, 10);
  expect(result).toBe(90);
});

// BETTER - Describes business rule
test('calculates price with discount applied to given product', () => {
  const originalPrice = 100;
  const discountPercentage = 10;

  const finalPrice = calculateDiscountedPrice(originalPrice, discountPercentage);

  expect(finalPrice).toBe(90);
});
```

## Integration Tests

### When to Use

- Repository adapters (real DB)
- External service adapters (real sandbox)

### Database Setup

```typescript
import { createTestDatabase } from '../../../shared/tests/integration/testDatabase';

describe('The PgOrderRepository', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await database.close();
  });

  beforeEach(async () => {
    await database.reset();
  });

  it('persists and retrieves an order', async () => {
    const repository = new PgOrderRepository(database.connection);
    const order = Order.create(Id.generate());

    await repository.save(order);
    const retrieved = await repository.findById(order.id);

    expect(retrieved?.id.equals(order.id)).toBe(true);
  });
});
```

### Rules

- **Real dependencies**: Use PGlite for PostgreSQL adapters in this repo
- **Isolation**: Each test cleans its own data
- **No shared state**: Tests must not depend on order of execution
- **File naming**: `*.integration.test.ts`

## E2E Tests

### When to Use

- Full HTTP flows through the API
- Critical user journeys

### Rules

- **Test flows, not endpoints**: Cover complete business scenarios
- **Factories/fixtures**: Use factories to create test data
- **Clean slate**: Reset database before each test
- **File naming**: `*.e2e.test.ts`

### What NOT to Test in E2E

- Edge cases (those belong in unit tests)
- Error handling details (unit tests)
- All validation combinations (unit tests)

## Security-Sensitive Tests

- Use fake non-production values only.
- Never assert, snapshot, log, or persist real secret values, tokens, cookies, client secrets, credentials, or copied Key Vault values.
- Prefer explicit tests that prove secret values are not rendered, cached, logged, persisted, or included in audit payloads.
