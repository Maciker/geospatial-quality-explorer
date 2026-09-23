# Inside-Out TDD Development

Follow the TDD cycle defined in the `xp-tdd-practices` skill for each layer.

## Development Flow

Always develop from the inside out:

```
Domain (Pure logic) -> UseCase -> Repository Adapter -> HTTP
```

This ensures:
- Pure business logic first
- No premature infrastructure decisions
- Testable from the core
- Clear dependency flow

## Layer Progression

```
1. Start with Domain value objects
   -> TDD cycle for each value object behavior

2. Then with Domain entities
   -> TDD cycle for each entity behavior

3. Build InMemoryRepositories
   -> TDD cycle for repository behavior

4. Add Domain Services (if needed)
   -> TDD cycle for complex domain logic

5. Build UseCases
   -> TDD cycle using InMemoryRepositories

6. Implement Repository Adapters
   -> Integration tests with real DB

7. Add External Service Adapters
   -> Integration tests with real sandbox

8. Wire up HTTP/Controllers
   -> E2E tests for full flow
```

## Unit Tests

### Domain Layer (entities, value objects, services)

Pure unit tests with no dependencies.

```typescript
describe('The Order', () => {
  it('calculates total from line items', () => {
    const order = Order.create(Id.generate());
    order.addItem(product, 2);

    const total = order.calculateTotal();

    expect(total.equals(Money.create(200, 'EUR'))).toBe(true);
  });
});
```

### Use Cases

Unit tests using InMemoryRepositories (not mocks).

```typescript
describe('The CreateOrderUseCase', () => {
  it('creates and persists an order', async () => {
    const orderRepository = new InMemoryOrderRepository();
    const productRepository = new InMemoryProductRepository([product]);
    const useCase = new CreateOrderUseCase(orderRepository, productRepository);

    const order = await useCase.execute(productId, 2);

    expect(order.id).toBeDefined();
    expect(await orderRepository.findById(order.id)).toBeDefined();
  });
});
```

## Integration Tests

### Repository Adapters

Test against real database.

```typescript
describe('The PgOrderRepository', () => {
  it('persists and retrieves an order', async () => {
    const repository = new PgOrderRepository(testDbConnection);
    const order = Order.create(Id.generate());

    await repository.save(order);
    const retrieved = await repository.findById(order.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id.equals(order.id)).toBe(true);
  });
});
```

### Application Port Adapters

Test against real external services (sandbox/test environment).

```typescript
describe('The StripePaymentAdapter', () => {
  it('charges the payment in test mode', async () => {
    const adapter = new StripePaymentAdapter(stripeTestClient);

    const result = await adapter.charge(Money.create(100, 'EUR'), 'tok_visa');

    expect(result.success).toBe(true);
  });
});
```

## Mocks Policy

### Never mock:
- Repositories (use InMemoryRepository instead)
- Domain entities or value objects
- Domain services
- External service adapters in integration tests (use real sandbox)

### Stubs/Spies ONLY in:
- UseCase tests when the UseCase depends on an external service port

```typescript
describe('The ProcessPaymentUseCase', () => {
  it('processes payment and notifies', async () => {
    const orderRepository = new InMemoryOrderRepository([order]);
    const paymentGateway = stubPaymentGateway({ success: true });
    const notifier = spyNotifier();
    const useCase = new ProcessPaymentUseCase(orderRepository, paymentGateway, notifier);

    await useCase.execute(orderId, paymentDetails);

    expect(notifier.notifyPaymentReceived).toHaveBeenCalledWith(orderId);
  });
});
```

## TDD Cycle per Layer

For each layer, follow the 5-step cycle:

0. **REASON** - Identify cases for the current layer, start with the simplest
1. **RED** - Write one failing test for the simplest case
2. **GREEN** - Implement minimum code, follow TPP
3. **REFACTOR** - Clean up while keeping tests green
4. **RE-EVALUATE** - Mark done, pick next simplest, repeat until layer is complete, then move outward
