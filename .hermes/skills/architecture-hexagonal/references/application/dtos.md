# DTOs & Boundaries

## Where DTOs Live

DTOs live in the Application layer, next to the UseCases that use them.

```
src/orders/
├── application/
│   ├── CreateOrderUseCase.ts
│   ├── GetOrderUseCase.ts
│   ├── CreateOrderRequest.ts   # Request DTO (if >3 params)
│   ├── OrderDTO.ts             # Response DTO
│   └── ports/
└── ...
```

## Response DTOs

```typescript
interface OrderDTO {
  id: string;
  status: string;
  total: number;
  currency: string;
  items: OrderItemDTO[];
  createdAt: string;
}

interface OrderItemDTO {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}
```

### Mapping in UseCase

```typescript
class GetOrderUseCase {
  async execute(orderId: string): Promise<OrderDTO> {
    const order = await this.orderRepository.findById(Id.create(orderId));
    if (order.isNone()) {
      throw DomainError.createNotFound(`Order ${orderId} not found`);
    }
    return this.toDTO(order.get());
  }

  private toDTO(order: Order): OrderDTO {
    return order.toPrimitives();
  }
}
```

If the DTO needs a different structure:

```typescript
private toDTO(order: Order): OrderSummaryDTO {
  const primitives = order.toPrimitives();
  return {
    id: primitives.id,
    totalAmount: primitives.total.amount,
    itemCount: primitives.items.length,
  };
}
```

## DTO Characteristics

- **Plain objects**: No methods, no behavior
- **Primitive types only**: string, number, boolean, arrays, nested DTOs
- **No domain types**: No Money, no Id, no entities
- **Serializable**: Can be JSON.stringify'd directly

```typescript
// BAD - Contains domain types
interface OrderDTO {
  id: Id;           // Domain type
  total: Money;     // Domain type
}

// GOOD - Only primitives
interface OrderDTO {
  id: string;
  total: number;
  currency: string;
}
```
