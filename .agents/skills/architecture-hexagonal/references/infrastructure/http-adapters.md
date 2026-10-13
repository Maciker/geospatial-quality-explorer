# HTTP API Design Detail

## Controller Structure

```typescript
class OrderController {
  constructor(
    private createOrderUseCase: CreateOrderUseCase,
    private getOrderUseCase: GetOrderUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const { productId, quantity } = req.body;
    if (!productId || typeof productId !== 'string') {
      return this.badRequest(res, 'productId is required');
    }
    if (typeof quantity !== 'number') {
      return this.badRequest(res, 'quantity must be a number');
    }

    try {
      const order = await this.createOrderUseCase.execute(productId, quantity);
      res.status(201).json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req: Request, res: Response): Promise<void> { ... }
  async list(req: Request, res: Response): Promise<void> { ... }

  private badRequest(res: Response, message: string): void {
    res.status(400).json({ error: message });
  }

  private handleError(error: unknown, res: Response): void { ... }
}
```

## Input Validation

Validate only types and nulls in the Controller. Business rules are validated in the domain.

```typescript
// BAD - Duplicates domain validation
if (quantity <= 0) {
  return this.badRequest(res, 'quantity must be positive');
}

// GOOD - Let PositiveNumber.create() validate this
// The UseCase will throw DomainError.createValidation() if invalid
```

## Error Handling in Controllers

Map DomainError types to HTTP status codes.

```typescript
import { DomainError } from '../../common/domain/DomainError';

class OrderController {
  private handleError(error: unknown, res: Response): void {
    if (error instanceof DomainError) {
      const statusMap = {
        notFound: 404,
        validation: 422,
        other: 400,
      };
      const status = statusMap[error.type];
      res.status(status).json({ error: error.message });
      return;
    }
    // Technical error - log and return 500
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Response Format

### Success: Return the resource directly

```typescript
// GET /orders/123
{
  "id": "123",
  "status": "confirmed",
  "total": 150.00,
  "items": [...]
}

// POST /orders (201 Created)
{
  "id": "456",
  "status": "draft",
  ...
}

// DELETE /orders/123 (204 No Content)
// No body
```

### Error: Return error message

```typescript
// 400, 404, 422, etc.
{
  "error": "Product prod-123 not found"
}
```
