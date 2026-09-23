# Classes and Modules Standards

## Rules

1. **Minimum scope for maximum cohesion**. If a method or function only uses a constant and nobody else uses it, put it inside the function

2. **Simple constructors**. If they have validation logic at creation, move it to a factory method and make the constructor private. If there is no complex validation, do not create unnecessary factory methods

3. **Class organization**: Public constructor(s) first (if they exist), followed by private constructor, then public API, finally private methods. In TypeScript, properties can be auto-injected in the constructor

4. **Encapsulation by default**. Use `private` for methods and do not export functions unless necessary. Limit accessibility

5. **Apply Law of Demeter and Tell, Don't Ask**

6. **Avoid anemic models**. Classes should encapsulate behavior, except at application boundaries where DTOs are used

7. **Complete objects at construction**. Objects should be fully initialized when created

8. **Never use JavaScript getters/setters**. No `get` or `set` syntax. Use explicit methods instead (`calculateTotal()`, `uptime()`) or readonly properties

9. **Never use underscore prefix for private members**. Use the `private` keyword instead of naming conventions like `_role` or `_name`

10. **Never use singletons**. If an instance has global state, manage it through the application factory module

11. **Composition over inheritance**. Avoid inheritance, prioritize composition

12. **Domain-specific types**. Build classes with behavior, especially in the application domain

## Examples

```typescript
// Tell, Don't Ask and Law of Demeter:
// WORSE - Ask (we ask and decide outside)
if (order.customer().address().city() === "Madrid") {
  order.applyDiscount(10);
}

// BETTER - Tell (we tell it what to do)
order.applyDiscountForCity("Madrid", 10);

// WORSE - Law of Demeter violation (long chain)
const city = user.account().settings().location().city();

// BETTER - Law of Demeter (single dot)
const city = user.city();

// Anemic Model vs Rich Model:
// WORSE - Anemic model
class Order {
  items: Item[];
  total: number;
}
// Logic outside
const total = order.items.reduce((sum, item) => sum + item.price, 0);

// BETTER - Rich model
class Order {
  private items: Item[];

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// Underscore prefix and getters/setters:
// WORSE - underscore prefix and getter
class User {
  private _role: UserRole;

  get role(): UserRole {
    return this._role;
  }
}

// BETTER - private keyword and explicit method
class User {
  private constructor(private role: UserRole) {}

  getRole(): UserRole {
    return this.role;
  }
}
```
