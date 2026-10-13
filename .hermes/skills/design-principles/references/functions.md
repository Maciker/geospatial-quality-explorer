# Function Design Standards

## Rules

1. **Contained size and single responsibility (SRP)**. Each function must "do exactly what its name indicates". Functions of 10-15 lines are a metric to detect if they have more than one responsibility; if they only have one responsibility, size does not matter

2. **Impeccable naming**. Function names must be verbs that precisely describe the action

3. **Minimum necessary signature**. Reduce arity (0-3 parameters is ideal). If exceeded, group them in an object with proper name and typing

4. **Avoid configuration parameters**. No boolean flags that change behaviors. Prefer specific functions (`show()/hide()`, `switchToReadMode()/switchToWriteMode()`)

5. **Optional parameters in moderation**. Maximum one; if avoidable, better

6. **Simple control flow**. Use guard clauses for edge cases and exit early; reduce indentation and cyclomatic complexity

7. **Readable conditions**: Abstract combined boolean expressions into explanatory variables or functions (`const isOnSale = ...`). Prioritize affirmative conditions. Avoid using else

8. **Separate control flow and business logic**. Extract iterations and branches; delegate calculations/mutations to dedicated functions or objects. Avoid using for

9. **Prefer declarative style when it improves readability**. Use `map/filter/reduce/forEach` with judgment; it is not dogma

10. **Encourage pure functions and referential transparency**. Avoid side effects when possible

11. **Apply CQS (Command-Query Separation)**: Commands mutate state and return void. Queries return value and do not mutate state. Know justified exceptions (e.g., create and return `Id` when inserting)

12. **Balance performance-readability**. Optimize only when necessary. Prioritize readability

13. **No comments on functions**

14. **Immutable collections**. Avoid push, pop, shift, unshift, splice. Prefer immutable operations that return new arrays

15. **Constants close to usage**. Define constants inside the function that uses them

16. **Use Maybe for optional values**. Never use `| undefined` or `| null` in return types. Use `Maybe<T>` to represent presence/absence of values

## Examples

```typescript
// Constants:
// WORSE
const maximumRetries = 3;
const timeoutMs = 5000;

function fetchWithRetry(url: string) {
  // ... uses maximumRetries far from definition
}

// BETTER
function fetchWithRetry(url: string) {
  const maximumRetries = 3;
  const timeoutMs = 5000;
  // ... uses constants right here
}

// Boolean parameters:
// WORSE
function render(showDetails: boolean) {
  if (showDetails) { /* ... */ }
  else { /* ... */ }
}

// BETTER
function renderWithDetails() { /* ... */ }
function renderSummary() { /* ... */ }

// CQS (Command-Query Separation):
// WORSE - Query that mutates state
function totalWithDiscount(percentage: number): number {
  this.appliedDiscount = percentage;
  return this.total * (1 - percentage / 100);
}

// BETTER - Command and Query separated
function applyDiscount(percentage: number): void {
  this.appliedDiscount = percentage;
}
function calculateTotal(): number {
  return this.baseTotal * (1 - this.appliedDiscount / 100);
}
```
