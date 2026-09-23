# Red-Green-Refactor example

## Red

```ts
it("returns a greeting", () => {
  expect(greet("Ada")).toBe("Hello, Ada");
});
```

Run the focused test. It should fail because `greet` does not exist or does not return the expected value.

## Green

```ts
export function greet(name: string): string {
  return `Hello, ${name}`;
}
```

Run the focused test. It should pass.

## Refactor

Improve naming, remove duplication or simplify structure without changing behavior.

Run the focused test and then the relevant suite.
