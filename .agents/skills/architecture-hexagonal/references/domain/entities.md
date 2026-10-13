# Domain Entities

Entities are objects with **identity** and **lifecycle**. Two entities are equal if they have the same identity, regardless of their attributes.

## Characteristics

- **Identity**: Has a unique identifier (use `Id` value object)
- **Lifecycle**: Can change state over time while maintaining its identity
- **Behavior**: Encapsulates business logic related to itself
- **Consistency**: Protects its invariants (business rules that must always be true)
- **Serializable**: Provides `toPrimitives()` method for serialization

## Structure

```typescript
export class Order {
  private constructor(
    readonly id: Id,
    private items: OrderItem[],
    private status: OrderStatus
  ) {}

  static create(id: Id): Order {
    return new Order(id, [], OrderStatus.Draft);
  }

  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.Draft) {
      throw DomainError.createValidation('Cannot add items to a non-draft order');
    }
    this.items = [...this.items, item];
  }

  confirm(): void {
    if (this.items.length === 0) {
      throw DomainError.createValidation('Cannot confirm an empty order');
    }
    this.status = OrderStatus.Confirmed;
  }

  toPrimitives() {
    return {
      id: this.id.value,
      items: this.items.map(item => item.toPrimitives()),
      status: this.status
    };
  }
}
```

## Identity

Use the generic `Id` value object for all entity identifiers. Never use primitive types directly.

```typescript
// WORSE - Primitive identity
class Order {
  constructor(readonly id: string) {}
}

// BETTER - Id value object
class Order {
  constructor(readonly id: Id) {}
}
```

## toPrimitives Method

Every entity must provide a `toPrimitives()` method that returns a plain object with only primitive types (string, number, boolean, arrays, nested plain objects). This is the single serialization contract — UseCases call `toPrimitives()` to build DTOs, and infrastructure adapters use it for persistence mapping. No coupling to specific DTO or document types.

## Invariants

Invariants are validated in factory methods, keeping constructors simple (assignment only).

```typescript
// GOOD - Validation in factory method, simple constructor
class Invoice {
  private constructor(
    readonly id: Id,
    private lineItems: LineItem[],
    private total: Money,
    private status: InvoiceStatus
  ) {}

  static create(id: Id, lineItems: LineItem[]): Invoice {
    if (lineItems.length === 0) {
      throw DomainError.createValidation('Invoice must have at least one line item');
    }
    const total = lineItems.reduce((sum, item) => sum.add(item.amount), Money.zero());
    return new Invoice(id, lineItems, total, InvoiceStatus.Draft);
  }
}

// WORSE - Validation in constructor
class Invoice {
  constructor(readonly id: Id, private lineItems: LineItem[]) {
    if (lineItems.length === 0) { throw ... }
  }
}
```

## Complete Objects (No Setters)

Entities must be complete at construction. No setters, no partial initialization. Encapsulate behavior.

```typescript
// WORSE - Anemic model with setters
class Order {
  id: Id;
  status: string;
  setStatus(status: string) { this.status = status; }
}

// BETTER - Complete object with behavior
class Order {
  private constructor(readonly id: Id, private status: OrderStatus) {}

  static create(id: Id): Order {
    return new Order(id, OrderStatus.Draft);
  }

  confirm(): void {
    if (this.status !== OrderStatus.Draft) {
      throw DomainError.createValidation('Only draft orders can be confirmed');
    }
    this.status = OrderStatus.Confirmed;
  }
}
```
