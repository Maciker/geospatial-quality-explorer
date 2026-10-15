# Naming Standards

## Rules

- Pronounceable in English, without technical abbreviations (abbreviations only allowed in lambda expressions with reduced scope)
- Avoid redundant prefixes/suffixes (`I`, `Impl`, `Abstract`)
- Concrete; avoid catch-all words (helper, util, manager) unless the domain requires it
- No type information; the IDE already shows it
- No aliases or synonyms for the same concept: one concept, one name
- Combine well with language grammar: `isPaidInvoice`, `sumOfNumbersIn(expression)`
- Prefer using "not" in the name over using the negation operator
- Distinguish nouns (classes, modules) from verbs (methods, functions), adjectives only for interfaces
- Allowed generic suffixes: DTO, Repository, Factory, Mapper, UseCase, Service
- Avoid comments if a self-explanatory name is possible
- Constants use camelCase, not SCREAMING_SNAKE_CASE
- Never use underscore prefix for private members
- Avoid magic strings, prefer enums to represent fixed sets of values
- Prefer enums over literal types for better refactoring support

## Examples

```typescript
// WORSE
const d = 42; // days
const usrCtrl = new UsrCtrl();
const IUserRepository = ...;
const fetchUserInfo = ...;

// BETTER
const daysUntilExpiration = 42;
const userAuthenticator = new UserAuthenticator();
const UserRepository = ...;
const findUser = ...;
```
