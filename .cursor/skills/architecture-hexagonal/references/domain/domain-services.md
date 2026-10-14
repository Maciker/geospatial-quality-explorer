# Domain Services

Domain Services contain business logic that does not naturally belong to a specific entity or value object. They are stateless functions that operate on domain objects.

## When to Use

Use a Domain Service when:
- The logic involves multiple entities
- The logic does not naturally belong to any single entity
- A business rule spans aggregates

## Characteristics

- **Stateless**: Pure functions, same input always produces same output
- **Domain language**: Named using domain terminology
- **Pure domain logic**: No infrastructure concerns (no DB, no HTTP)
- **Operates on domain objects**: Receives and returns entities/value objects

## Structure

Domain services are functions, not classes. Group related functions in a module.

```typescript
// src/orders/domain/services/pricing.ts

export function calculateOrderTotal(order: Order, discounts: Discount[]): Money {
  const subtotal = order.calculateSubtotal();
  const applicableDiscounts = discounts.filter(d => d.appliesTo(order));

  return applicableDiscounts.reduce(
    (total, discount) => discount.apply(total),
    subtotal
  );
}

export function applyVolumeDiscount(order: Order): Money {
  const volumeThreshold = 10;
  const discountPercentage = 0.1;

  if (order.totalQuantity() >= volumeThreshold) {
    return order.calculateSubtotal().multiply(discountPercentage);
  }
  return Money.zero();
}
```

## Domain Service vs Use Case

| Domain Service | Use Case |
|----------------|----------|
| Pure functions | Orchestrates application flow |
| No external dependencies | Uses ports (repositories, external services) |
| Lives in `domain/services/` | Lives in `application/` |
| Called by entities or use cases | Entry point from infrastructure |

```typescript
// Domain Service - pure function
// src/orders/domain/services/pricing.ts
export function calculateDiscount(order: Order): Money { ... }

// Use Case - orchestrates and uses ports
// src/orders/application/CreateOrderUseCase.ts
import { calculateDiscount } from '../domain/services/pricing';

class CreateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  execute(productId: string, quantity: number): Order {
    const order = Order.create(...);
    const discount = calculateDiscount(order);
    order.applyDiscount(discount);
    this.orderRepository.save(order);
    return order;
  }
}
```
