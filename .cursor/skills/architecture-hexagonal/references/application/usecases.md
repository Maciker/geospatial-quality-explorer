# Use Cases Detail

## Structure

```typescript
import { calculateDiscount } from '../domain/services/pricing';

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async execute(productId: string, quantity: number): Promise<OrderDTO> {
    const product = await this.productRepository.findById(Id.create(productId));
    if (product.isNone()) {
      throw DomainError.createNotFound(`Product ${productId} not found`);
    }

    const order = Order.create(Id.generate());
    order.addItem(product.get(), quantity);

    const discount = calculateDiscount(order);
    order.applyDiscount(discount);

    await this.orderRepository.save(order);
    return this.toDTO(order);
  }

  private toDTO(order: Order): OrderDTO {
    return order.toPrimitives();
  }
}
```

## Terminal-Friendly Parameters

```typescript
// WORSE - Complex request object for few parameters
class CreateOrderUseCase {
  execute(request: { productId: string; quantity: number }): Promise<OrderDTO> { ... }
}

// BETTER - Primitive parameters (terminal-friendly)
class CreateOrderUseCase {
  execute(productId: string, quantity: number): Promise<OrderDTO> { ... }
}

// ALSO GOOD - When more than 3 parameters
interface CreateInvoiceRequest {
  customerId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
}

class CreateInvoiceUseCase {
  execute(request: CreateInvoiceRequest): Promise<InvoiceDTO> {
    const customerId = Id.create(request.customerId);
    const money = Money.create(request.amount, request.currency);
    // ...
  }
}
```

## Single Entry Point

```typescript
// WORSE - Multiple entry points
class OrderUseCase {
  create() { ... }
  update() { ... }
  delete() { ... }
}

// BETTER - Single responsibility
class CreateOrderUseCase {
  execute(productId: string, quantity: number): Promise<OrderDTO> { ... }
}

class UpdateOrderUseCase {
  execute(orderId: string, quantity: number): Promise<OrderDTO> { ... }
}
```

## Dependencies

```typescript
import { calculateShippingCost } from '../domain/services/shippingCalculator';

class ProcessPaymentUseCase {
  constructor(
    private orderRepository: OrderRepository,       // Port
    private paymentGateway: PaymentGateway          // Port (external service)
  ) {}

  async execute(orderId: string, paymentMethod: string): Promise<void> {
    const order = await this.orderRepository.findById(Id.create(orderId));
    if (order.isNone()) throw DomainError.createNotFound('Order not found');

    const shippingCost = calculateShippingCost(order.get(), order.get().destination);
    const total = order.get().calculateTotal().add(shippingCost);

    await this.paymentGateway.charge(total, paymentMethod);
    order.get().markAsPaid();
    await this.orderRepository.save(order.get());
  }
}
```
