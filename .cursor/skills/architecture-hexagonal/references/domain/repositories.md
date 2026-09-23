# Domain Repositories

## Repository Interface And InMemory Implementation

Repository interfaces and their InMemory implementations live together in `domain/repositories/`.

`Maybe<T>` is the project pattern for optional domain values. It replaces `null` and `undefined` in repository results and similar optional flows.

```typescript
// src/orders/domain/repositories/OrderRepository.ts

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: Id): Promise<Maybe<Order>>;
  findByCustomer(customerId: Id): Promise<Order[]>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  constructor(initialOrders: Order[] = []) {
    initialOrders.forEach(order => this.orders.set(order.id.value, order));
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id.value, order);
  }

  async findById(id: Id): Promise<Maybe<Order>> {
    return Maybe.fromNullable(this.orders.get(id.value));
  }

  async findByCustomer(customerId: Id): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId.equals(customerId));
  }
}
```

## Repository Characteristics

- **Domain language**: Use domain terms, not database terms.
- **Entity-centric**: Work with domain entities, not primitives or DTOs.
- **No implementation details**: The interface does not reveal the storage mechanism.

```typescript
// WORSE - Database-oriented interface
interface OrderRepository {
  insert(order: OrderRow): Promise<void>;
  findOne(id: string): Promise<OrderRow | undefined>;
}

// BETTER - Domain-oriented interface
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: Id): Promise<Maybe<Order>>;
}
```

## Real Adapter

Real adapters implement repository interfaces with actual database logic. They live in `infrastructure/adapters/`.

```typescript
// src/orders/infrastructure/adapters/PgOrderRepository.ts
export class PgOrderRepository implements OrderRepository {
  constructor(private database: DatabaseConnection) {}

  async save(order: Order): Promise<void> {
    const row = this.toRow(order);
    await this.database
      .insert(orders)
      .values(row)
      .onConflictDoUpdate({ target: orders.id, set: row });
  }

  async findById(id: Id): Promise<Maybe<Order>> {
    const row = await this.database.query.orders.findFirst({
      where: equals(orders.id, id.value),
    });
    return Maybe.fromNullable(row).map(row => this.toDomain(row));
  }

  private toRow(order: Order): OrderRow {
    return { id: order.id.value, ...order.toPrimitives() };
  }

  private toDomain(row: OrderRow): Order {
    // Map database row to domain entity.
  }
}
```

## When To Use Each

| Context | Use |
| --- | --- |
| UseCase unit tests | InMemoryRepository |
| Repository adapter tests | Real adapter + real DB |
| E2E tests | Real adapter + real DB |
| Production | Real adapter |

## File Structure

```text
src/orders/
  domain/
    repositories/
      OrderRepository.ts       # Interface + InMemory implementation
  infrastructure/
    adapters/
      PgOrderRepository.ts     # Real adapter for production
```
