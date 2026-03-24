# MoneyMate API — CLAUDE.md

## Project overview
MoneyMate is a personal finance tracking REST API that lets users manage
transactions, budgets, and spending categories. It is intentionally simple
to keep the codebase readable and focused.

**Stack:** TypeScript · Node.js · Express · In-memory store (no DB for now)
**Test framework:** Jest + ts-jest
**Package manager:** npm

---

## Code standards
- Follow SOLID principles at all times — see `.claude/skills/solid-principles/`
- All endpoints must validate input using **Zod schemas**
- Error responses must follow this exact shape:
  ```json
  { "error": "string", "code": "string", "statusCode": number }
  ```
- Success responses must follow this shape:
  ```json
  { "data": <payload>, "message": "optional string" }
  ```
- **No `console.log` in any source file** — always use the `logger` utility in `src/logger.ts`
- All new services must implement and depend on a repository interface (see `ITransactionRepository` as the pattern)

---

## File structure
```
src/
  index.ts          — Express app entry point
  router.ts         — All route definitions
  transactions.ts   — Transaction service + repository
  budgets.ts        — Budget service + repository
  categories.ts     — Category service + repository
  reports.ts        — Reports service (stub — see Epic MM-50)
  store.ts          — In-memory data store
  logger.ts         — Structured JSON logger
  types.ts          — Shared TypeScript interfaces
tests/
  transactions.test.ts
.claude/
  CLAUDE.md         — this file
  agents/           — subagent definitions
  skills/           — reusable skill files
```

---

## Git conventions
- **Branch naming:** `feature/MM-{jira-id}-short-description` or `fix/MM-{jira-id}-short-description`
- **Commit messages:** `MM-{jira-id}: {imperative verb} {what changed}`
  - Example: `MM-42: fix off-by-one error in monthly transaction filter`
- **Never push directly to `main`** — always open a pull request
- **PR titles** must reference the Jira ticket: `MM-42: Fix monthly total boundary date bug`
- PR description must include: what changed, why, and how to test

---

## Agent rules — read carefully
1. **Always read the relevant Jira ticket before writing any code.** Use the Jira MCP tool.
2. **Run the full test suite before marking any task complete:** `npm test`
3. **Only fix what the ticket asks.** If you spot other issues, flag them in a comment — do not fix them unilaterally.
4. **Never modify `CLAUDE.md`, agent files, or skill files** unless explicitly asked.
5. **Human approval is required before opening any PR.** Prepare the PR draft and wait for confirmation.
6. **All new code must pass TypeScript strict mode** — no `any` types without justification.

---

## Running the project
```bash
npm install          # install dependencies
npm test             # run test suite
npm run dev          # start dev server on port 3000
npm run build        # compile TypeScript
```

---

## Key design decisions
- Services depend on repository **interfaces**, not concrete classes — enables easy testing and future DB swap
- Zod is used for runtime validation at the API boundary — TypeScript types alone are not enough
- The logger outputs structured JSON to stdout — easy to pipe into any log aggregator
