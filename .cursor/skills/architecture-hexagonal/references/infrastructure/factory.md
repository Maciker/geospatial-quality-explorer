# Factory Pattern Examples

Use a simple static Factory class instead of DI containers (InversifyJS, tsyringe). Why: DI containers add magic (decorators, metadata reflection, runtime resolution) that obscures the dependency graph. A plain Factory makes all wiring explicit, visible, and debuggable — the dependency tree is readable code, not container configuration.

## Full Factory Structure

```typescript
// src/factory.ts

export class Factory {
  // Cached instances
  private static orderRepository: OrderRepository;
  private static productRepository: ProductRepository;
  private static database: DatabaseConnection;

  // --- Infrastructure (cached) ---

  static async connectToPostgres(): Promise<void> {
    this.database = await createDatabaseConnection(process.env.DATABASE_URL);
  }

  private static getOrderRepository(): OrderRepository {
    if (!this.orderRepository) {
      this.orderRepository = new PgOrderRepository(this.database);
    }
    return this.orderRepository;
  }

  private static getProductRepository(): ProductRepository {
    if (!this.productRepository) {
      this.productRepository = new PgProductRepository(this.database);
    }
    return this.productRepository;
  }

  // --- Use Cases (new instance each time) ---

  static createCreateOrderUseCase(): CreateOrderUseCase {
    return new CreateOrderUseCase(
      this.getOrderRepository(),
      this.getProductRepository()
    );
  }

  static createGetOrderUseCase(): GetOrderUseCase {
    return new GetOrderUseCase(this.getOrderRepository());
  }

  // --- Controllers (new instance each time) ---

  static createOrderController(): OrderController {
    return new OrderController(
      this.createCreateOrderUseCase(),
      this.createGetOrderUseCase()
    );
  }
}
```

## When to Use `get` vs `create`

### `get` (cached/singleton)
- Database connections
- Repository adapters
- External service adapters
- Anything expensive to create or stateful

### `create` (new instance)
- UseCases
- Controllers
- Request-scoped objects
- Anything stateless or per-request

## File Location

```
src/
├── factory.ts          # Main factory
├── orders/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── products/
    └── ...
```

## Testing

For tests, create separate factory files that use InMemoryRepositories instead of real adapters.
