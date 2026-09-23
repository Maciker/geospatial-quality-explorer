# Value Objects

Value Objects are **immutable** objects defined by their **attributes**, not by identity.

## The Id Value Object

Use a single generic `Id` value object for all entity identifiers instead of separate `OrderId`, `ProductId` types. Why: in this architecture, identifiers share identical behavior (create, generate, equals, toPrimitives) — separate types add boilerplate without meaningful type safety, since cross-entity ID comparisons are caught by the domain logic, not the type system.

```typescript
export class Id {
  private constructor(readonly value: string) {}

  static create(value: string): Id {
    if (!value || value.trim() === '') {
      throw DomainError.createValidation('Id cannot be empty');
    }
    return new Id(value);
  }

  static generate(): Id {
    return new Id(crypto.randomUUID());
  }

  equals(other: Id): boolean {
    return this.value === other.value;
  }

  toPrimitives(): string {
    return this.value;
  }
}
```

## Structure

```typescript
export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw DomainError.createValidation('Amount cannot be negative');
    }
    return new Money(amount, currency);
  }

  static zero(currency: string = 'EUR'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw DomainError.createValidation('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toPrimitives(): { amount: number; currency: string } {
    return { amount: this.amount, currency: this.currency };
  }
}
```

## Immutability

Operations must return new instances, never mutate the original.

```typescript
// WORSE - Mutating the value object
class Money {
  add(other: Money): void {
    this.amount += other.amount;
  }
}

// BETTER - Returning a new instance
class Money {
  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

## Self-Validation

Value objects validate constraints in factory methods, keeping constructors simple.

```typescript
export class Email {
  private constructor(readonly value: string) {}

  static create(value: string): Email {
    if (!value.includes('@')) {
      throw DomainError.createValidation('Invalid email format');
    }
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toPrimitives(): string {
    return this.value;
  }
}
```

## Common Value Objects

- **Identifier**: `Id` (single generic identifier for all entities)
- **Money**: `Money`, `Price`, `Amount`
- **Dates**: `DateRange`, `Period`
- **Contact**: `Email`, `PhoneNumber`, `Address`
- **Quantities**: `Quantity`, `Percentage`
