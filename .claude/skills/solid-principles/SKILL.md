---
name: solid-principles
description: >
  Apply SOLID design principles to all code. Invoke automatically when
  writing, reviewing, or refactoring classes, services, functions, or
  interfaces in any source file.
---

# SOLID principles for MoneyMate API

These principles are non-negotiable for all code in this project.
They are not aspirational guidelines — they are hard requirements.

---

## S — Single Responsibility Principle

> A class or function should have one, and only one, reason to change.

**In MoneyMate terms:**
- `TransactionService` handles business logic for transactions — not budgets, not categories
- `TransactionRepository` handles data access — it does not perform calculations
- The router handles HTTP concerns only — no business logic in route handlers
- The logger handles logging — no other class writes to stdout directly

**Violation signals:**
- A service method does validation AND persistence AND calculation
- A repository method contains business rules
- A function is longer than ~40 lines

**Correct pattern:**
```typescript
// Good: one responsibility each
class TransactionRepository { /* data access only */ }
class TransactionService { /* business logic only, depends on repo interface */ }
```

---

## O — Open/Closed Principle

> Software entities should be open for extension but closed for modification.

**In MoneyMate terms:**
- Add new report types by implementing a strategy interface — do not add more `if` statements to `ReportService`
- Add new transaction categories by extending the store — do not modify validation logic
- New endpoint behaviour should extend the router — not modify existing route handlers

**Violation signals:**
- A switch/if-else statement that will need a new branch every time a new type is added
- Modifying a working, tested class to add new behaviour instead of extending it

**Correct pattern:**
```typescript
// Good: new report types extend this interface, not modify ReportService
interface IReportStrategy {
  generate(year: number, month: number): ReportData;
}
```

---

## L — Liskov Substitution Principle

> Subtypes must be substitutable for their base types without breaking correctness.

**In MoneyMate terms:**
- Any class implementing `ITransactionRepository` must honour the full contract — return types, error conditions, and behaviour
- If `TransactionService` works with `TransactionRepository`, it must work equally well with a `PostgresTransactionRepository` that implements the same interface

**Violation signals:**
- An implementation throws exceptions the interface doesn't declare
- An implementation returns `null` where the interface says `T | undefined` is the contract
- Tests break when you swap one implementation for another

---

## I — Interface Segregation Principle

> No class should be forced to depend on methods it does not use.

**In MoneyMate terms:**
- Keep repository interfaces focused — if a service only reads, give it a read-only interface
- Don't create one giant `IDataStore` interface that every service must implement in full

**Violation signals:**
- An interface has 10+ methods but implementors only use 3
- A class implements an interface and leaves half the methods as `throw new Error('not implemented')`

**Correct pattern:**
```typescript
// Good: focused interfaces
interface ITransactionReader { findAll(): Transaction[]; findById(id: string): Transaction | undefined; }
interface ITransactionWriter { create(input: CreateTransactionInput): Transaction; }
// Services depend only on what they need
class ReportService { constructor(private reader: ITransactionReader) {} }
```

---

## D — Dependency Inversion Principle

> Depend on abstractions, not concretions. High-level modules should not depend on low-level modules.

**In MoneyMate terms:**
- `TransactionService` depends on `ITransactionRepository` (interface) — not `TransactionRepository` (class)
- Dependencies are injected via the constructor — never instantiated with `new` inside a class body
- The singleton export at the bottom of each file wires up the concrete implementation — services never do this themselves

**Violation signals:**
- `new SomeRepository()` inside a service class body
- `import { TransactionRepository }` inside `TransactionService`
- A service that is impossible to unit test because its dependency is hardcoded

**Correct pattern:**
```typescript
// Good: depends on interface, injected via constructor
export class TransactionService {
  constructor(private readonly repo: ITransactionRepository) {}
}
// Wiring happens at the module level, not inside the class
export const transactionService = new TransactionService(new TransactionRepository());
```

---

## Quick reference card

| Principle | One-liner | Violation smell |
|-----------|-----------|-----------------|
| S | One reason to change | God classes, giant functions |
| O | Extend, don't modify | Switch statements that grow forever |
| L | Swap implementations safely | Tests break on substitution |
| I | Small, focused interfaces | Interfaces with unused methods |
| D | Inject dependencies | `new Dependency()` inside a class |
