# Error Handling

## DomainError with Factory Methods

Use a single `DomainError` class with factory methods.

```typescript
export class DomainError extends Error {
  private constructor(
    readonly type: 'notFound' | 'validation' | 'other',
    message: string
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static createNotFound(message: string): DomainError {
    return new DomainError('notFound', message);
  }

  static createValidation(message: string): DomainError {
    return new DomainError('validation', message);
  }

  static create(message: string): DomainError {
    return new DomainError('other', message);
  }
}
```

## Error Types

| Factory Method | Type | Use |
|----------------|------|-----|
| `createNotFound()` | notFound | Entity does not exist |
| `createValidation()` | validation | Invariant violated, invalid state |
| `create()` | other | Other domain errors |

## Usage Examples

### In Value Objects (invariants in factory)

```typescript
export class PositiveNumber {
  private constructor(readonly value: number) {}

  static create(value: number): PositiveNumber {
    if (value <= 0) {
      throw DomainError.createValidation('Quantity must be positive');
    }
    return new PositiveNumber(value);
  }
}
```

### In Entities (invariants in factory or methods)

```typescript
class Order {
  addItem(product: Product, quantity: PositiveNumber): void {
    if (this.status !== OrderStatus.Draft) {
      throw DomainError.createValidation('Cannot modify a confirmed order');
    }
    // ... add item
  }
}
```

### In Use Cases (not found)

```typescript
class CreateOrderUseCase {
  async execute(productId: string): Promise<OrderDTO> {
    const product = await this.productRepository.findById(Id.create(productId));
    if (!product) {
      throw DomainError.createNotFound(`Product ${productId} not found`);
    }
    // ... create order
  }
}
```

## Domain Errors vs Technical Errors

| Type | Examples | Handling |
|------|----------|----------|
| Domain | not found, validation failed | Catch and return appropriate HTTP status |
| Technical | DB connection failed, timeout | Let bubble up, log, return 500 |

## Error Messages

### Include
- Human-readable description
- Relevant context (IDs, values)

### Never Include
- Stack traces
- Internal implementation details
- Database table names
- File paths

```typescript
// GOOD
throw DomainError.createNotFound(`Product ${productId} not found`);

// BAD - Exposes internals
throw DomainError.createNotFound(
  `Product not found in 'products' (OrderRepository.findById)`);
```

## When to Throw

### Throw for:
- Invariant violations (business rules broken)
- Entity not found (when required for operation)
- Invalid state transitions
- Validation failures

### Do not throw for:
- Optional values (return `Maybe.none()`)
- Expected empty results (return empty array)

```typescript
// Throw - entity must exist for operation
const order = await this.orderRepository.findById(orderId);
if (order.isNone()) {
  throw DomainError.createNotFound(`Order ${orderId} not found`);
}

// Return Maybe - querying is not an error
async findById(id: Id): Promise<Maybe<Order>> {
  return Maybe.fromNullable(this.orders.get(id.value));
}

// Return empty array - no results is valid
async findByCustomer(customerId: Id): Promise<Order[]> {
  return this.orders.filter(o => o.customerId.equals(customerId));
}
```
