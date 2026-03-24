---
name: api-standards
description: >
  Apply MoneyMate REST API conventions to all endpoint design, error handling,
  validation, and response formatting. Invoke automatically when writing or
  reviewing route handlers, service methods, or any code that touches the
  HTTP boundary.
---

# API Standards for MoneyMate API

These conventions ensure every endpoint in MoneyMate behaves consistently.
A developer hitting any endpoint for the first time should be able to predict
the shape of every response without reading the source code.

---

## Response envelope

All responses — success and error — use a consistent JSON envelope.

### Success response
```json
{
  "data": { },
  "message": "Optional human-readable confirmation"
}
```
- `data` is always present on success — never return a naked object
- `message` is optional — use it for write operations (POST, PATCH, DELETE)
- HTTP status codes: `200` for reads, `201` for resource creation

### Error response
```json
{
  "error": "Human-readable description of what went wrong",
  "code":  "MACHINE_READABLE_CODE",
  "statusCode": 400
}
```
- `error` — sentence-case, user-readable, no stack traces
- `code`  — UPPER_SNAKE_CASE, used by clients to handle errors programmatically
- `statusCode` — must match the HTTP status code of the response

### Standard error codes

| code | HTTP status | when to use |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Zod parse failed — invalid input shape |
| `MISSING_PARAMS` | 400 | Required query params absent |
| `INVALID_MONTH` | 400 | Month param outside 1–12 or wrong format |
| `NOT_FOUND` | 404 | Resource does not exist |
| `NOT_IMPLEMENTED` | 501 | Feature stub not yet built |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Input validation

All user input **must** be validated with Zod at the API boundary — before
it reaches the service layer. TypeScript types are compile-time only; Zod
provides runtime safety.

```typescript
// Good: validate at the boundary
router.post('/transactions', (req, res) => {
  const result = transactionService.create(req.body); // service handles Zod internally
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.status(201).json({ data: result, message: 'Transaction created successfully' });
});
```

**Rules:**
- Define schemas with `z.object({})` — never trust `req.body` shape directly
- Use `.safeParse()` not `.parse()` — so you can return a structured error rather than throw
- Schema definitions live in the same file as the service they validate
- All schema types must be exported for use in tests

---

## URL conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `/api/{resource}` | `/api/transactions` | Collection |
| `/api/{resource}/:id` | `/api/transactions/txn-001` | Single resource by ID |
| `/api/{resource}/{sub}/:id` | `/api/budgets/month/2025-01` | Filtered sub-collection |
| `/api/{resource}/{action}` | `/api/reports/summary` | Resource-scoped action |

**Rules:**
- Always plural nouns: `/transactions` not `/transaction`
- Kebab-case for multi-word segments: `/monthly-total` not `/monthlyTotal`
- Query params for filtering/pagination: `?year=2025&month=1`
- Path params for resource identity: `/:id`

---

## Logging

Use the `logger` utility from `src/logger.ts` for all output.
**Never use `console.log`, `console.error`, or `console.warn` in source files.**

```typescript
// Good
import { logger } from './logger';
logger.info('Transaction created', { id: transaction.id });
logger.error('Unexpected failure', { message: err.message });

// Bad — will fail code review
console.log('Transaction created');
```

Log levels:
- `info` — normal operations (resource created, request handled)
- `warn` — degraded state, stub hit, recoverable issue
- `error` — unexpected failure, always include context object
- `debug` — verbose detail, only for development troubleshooting

---

## TypeScript standards

- **Strict mode is on** — no implicit `any`, no unchecked nulls
- Never use `any` without a comment explaining why it's unavoidable
- Prefer `interface` for object shapes that may be extended
- Prefer `type` for unions, intersections, and aliases
- All exported functions must have explicit return types
- Use `unknown` instead of `any` for untrusted external input

```typescript
// Good: explicit return type, unknown input
create(input: unknown): Transaction | ApiError {
  const parsed = CreateTransactionSchema.safeParse(input);
  ...
}

// Bad: implicit any, no return type
create(input) {
  ...
}
```

---

## Error handling pattern

Services return `T | ApiError` — they never throw.
Route handlers use the `isApiError` helper to branch.

```typescript
// In the service
getById(id: string): Transaction | ApiError {
  const t = this.repo.findById(id);
  if (!t) return { error: 'Transaction not found', code: 'NOT_FOUND', statusCode: 404 };
  return t;
}

// In the route handler
router.get('/transactions/:id', (req, res) => {
  const result = transactionService.getById(req.params.id);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});
```

This pattern means:
- No try/catch scattered through route handlers
- Errors are explicit in function signatures
- Every error path is testable without simulating throws

---

## Quick reference card

| Concern | Rule |
|---------|------|
| Success envelope | `{ data: T, message?: string }` |
| Error envelope | `{ error, code, statusCode }` |
| Validation | Zod `.safeParse()` at service boundary |
| Logging | `logger` only — no `console.*` |
| URL style | Plural nouns, kebab-case, query params for filters |
| TypeScript | Strict mode, no `any`, explicit return types |
| Error flow | Services return `T \| ApiError`, never throw |
