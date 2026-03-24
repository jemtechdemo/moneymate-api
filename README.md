# MoneyMate API

A personal finance tracking REST API. Manage transactions, budgets, and spending categories.

## Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **Framework:** Express
- **Validation:** Zod
- **Testing:** Jest + ts-jest
- **Storage:** In-memory (no database required)

## Getting started

```bash
npm install
npm run dev      # starts on http://localhost:3000
npm test         # run the test suite
npm run build    # compile to dist/
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/:id` | Get transaction by ID |
| GET | `/api/transactions/monthly-total?year=&month=` | Monthly income/expense totals |
| POST | `/api/transactions` | Create a transaction |
| GET | `/api/budgets` | List all budgets |
| GET | `/api/budgets/month/:month` | Budgets for a given month (YYYY-MM) |
| POST | `/api/budgets` | Create a budget |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get category by ID |
| GET | `/api/reports/summary?year=&month=` | Monthly spending summary *(stub — MM-50)* |

## Project structure

```
src/
  index.ts          — Express entry point
  router.ts         — Route definitions
  transactions.ts   — Transaction service + repository
  budgets.ts        — Budget service + repository
  categories.ts     — Category service + repository
  reports.ts        — Reports service (stub)
  store.ts          — In-memory data store
  logger.ts         — Structured JSON logger
  types.ts          — Shared TypeScript interfaces
tests/
  transactions.test.ts
.claude/
  CLAUDE.md         — Agent project memory
  agents/           — Claude Code subagent definitions
  skills/           — Reusable agent skills
```

## Claude Code agent setup

This project includes a full Claude Code agent configuration:

- **CLAUDE.md** — project memory loaded by every agent session
- **Agents:** `analyser`, `developer`, `qa-engineer`, `reviewer`
- **Skills:** `solid-principles`, `api-standards`

Run Claude Code from the project root:

```bash
claude
```

## Known issues

- **MM-4** — `GET /transactions/monthly-total` excludes transactions on the last day of the month
- **MM-50** — `GET /reports/summary` not yet implemented
