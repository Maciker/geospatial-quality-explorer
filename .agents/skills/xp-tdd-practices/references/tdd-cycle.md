# TDD Cycle with TPP Example

## Full TPP Example in Action

```typescript
// Navigator (REASON):
"List of examples to calculate total prices:
1. Empty list
2. List with one price
3. List with multiple prices"

// Test 1: Empty list
test('calculates total of empty price list', () => {
  const prices = [];

  const total = calculateTotal(prices);

  expect(total).toBe(0);
});

// Driver (RED): Does not compile -> Minimum to compile
function calculateTotal(prices) {}

// Test fails (undefined !== 0)

// Navigator (GREEN): "According to TPP: ({} -> constant)"
// Driver (GREEN):
function calculateTotal(prices) {
  return 0;
}

// Test passes

// Navigator (REFACTOR): "Test passes, now refactor. All clear for now"

// Navigator (RE-EVALUATE): "The next simplest case is: list with one price"

// Test 2: List with one price
test('calculates total of single price', () => {
  const prices = [100];

  const total = calculateTotal(prices);

  expect(total).toBe(100);
});

// Test fails (0 !== 100)

// Navigator (GREEN): "According to TPP: (constant -> scalar) - use the parameter"
// Driver (GREEN):
function calculateTotal(prices) {
  if (prices.length === 0) return 0;
  return prices[0];
}

// Both tests pass

// Navigator (REFACTOR): "Test passes, now refactor.
// According to design-principles, use a guard clause. Names are clear"

// Navigator (RE-EVALUATE): "The next case is: list with multiple prices"

// Test 3: List with multiple prices
test('calculates total of multiple prices', () => {
  const prices = [100, 50, 25];

  const total = calculateTotal(prices);

  expect(total).toBe(175);
});

// Test fails (100 !== 175)

// Navigator (GREEN): "According to TPP I have options:
// - (statement -> tail-recursion) - transformation #9
// - (if -> while) - transformation #10
//
// But in this language, declarative style with reduce is simpler
// and clearer than recursion or loops. Per design-principles:
// 'Prefer declarative style when it improves readability'"

// Driver (GREEN):
function calculateTotal(prices) {
  return prices.reduce((sum, price) => sum + price, 0);
}

// All tests pass

// Navigator (REFACTOR): "Test passes, now refactor.
// The code is simple and expressive. Looks good"
```

## Continuous Refactoring

- Actively identify code smells
- Suggest constant incremental improvements following the `design-principles` skill
- Propose extracting functions when there is complexity
