// ============================================================
// MoneyMate API — Reports Service Tests (MM-9)
// ============================================================
// Tests exercise ReportService directly (same pattern as
// transactions.test.ts) to avoid port-binding issues caused
// by the app.listen() call in src/index.ts.
// ============================================================

import { ReportService, ReportRepository } from '../src/reports';
import { TransactionRepository } from '../src/transactions';
import { store } from '../src/store';
import { Transaction } from '../src/types';

// Seed data matching store.ts exactly for deterministic resets
const seedTransactions: Transaction[] = [
  {
    id: 'txn-001', amount: 2500, type: 'income', category: 'Salary',
    description: 'January salary', date: '2025-01-15',
    createdAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'txn-002', amount: 45.50, type: 'expense', category: 'Food & Drink',
    description: 'Weekly shop', date: '2025-01-10',
    createdAt: '2025-01-10T12:00:00.000Z',
  },
  {
    id: 'txn-003', amount: 32.00, type: 'expense', category: 'Transport',
    description: 'Monthly bus pass', date: '2025-01-05',
    createdAt: '2025-01-05T08:00:00.000Z',
  },
  {
    id: 'txn-004', amount: 89.99, type: 'expense', category: 'Shopping',
    description: 'End of month treat', date: '2025-01-31',
    createdAt: '2025-01-31T18:00:00.000Z',
  },
  {
    id: 'txn-005', amount: 28.00, type: 'expense', category: 'Food & Drink',
    description: 'Last day dinner', date: '2025-01-31',
    createdAt: '2025-01-31T20:00:00.000Z',
  },
  {
    id: 'txn-006', amount: 2500, type: 'income', category: 'Salary',
    description: 'February salary', date: '2025-02-15',
    createdAt: '2025-02-15T09:00:00.000Z',
  },
  {
    id: 'txn-007', amount: 55.00, type: 'expense', category: 'Utilities',
    description: 'Electric bill', date: '2025-02-20',
    createdAt: '2025-02-20T10:00:00.000Z',
  },
  {
    id: 'txn-008', amount: 15.00, type: 'expense', category: 'Entertainment',
    description: 'Streaming subscription', date: '2025-02-28',
    createdAt: '2025-02-28T00:00:00.000Z',
  },
];

// Helper: create a ReportService backed by the real in-memory store
function makeService(): ReportService {
  return new ReportService(new ReportRepository(new TransactionRepository()));
}

beforeEach(() => {
  store.transactions = [...seedTransactions];
});

// ============================================================
// Scenario 1: Happy path — valid year/month with mixed
// transactions returns correct summary (Jan 2025)
// Jan totals: income=2500, expenses=45.50+32+89.99+28=195.49
// ============================================================
describe('ReportService.getSummary — happy path (Jan 2025)', () => {
  test('returns correct month label, totals and netAmount', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.month).toBe('2025-01');
    expect(result.totalIncome).toBeCloseTo(2500, 2);
    expect(result.totalExpenses).toBeCloseTo(195.49, 2);
    expect(result.netAmount).toBeCloseTo(2304.51, 2);
  });

  test('byCategory is an array with correct structure', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(Array.isArray(result.byCategory)).toBe(true);
    expect(result.byCategory.length).toBeGreaterThan(0);

    for (const entry of result.byCategory) {
      expect(typeof entry.category).toBe('string');
      expect(typeof entry.amount).toBe('number');
      expect(typeof entry.percentage).toBe('number');
      expect(typeof entry.transactionCount).toBe('number');
    }
  });

  test('byCategory is sorted by amount descending', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    const { byCategory } = result;
    for (let i = 0; i < byCategory.length - 1; i++) {
      expect(byCategory[i].amount).toBeGreaterThanOrEqual(byCategory[i + 1].amount);
    }
  });

  test('byCategory contains correct categories, amounts and counts', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    const { byCategory } = result;

    const shopping = byCategory.find(c => c.category === 'Shopping');
    const foodDrink = byCategory.find(c => c.category === 'Food & Drink');
    const transport = byCategory.find(c => c.category === 'Transport');

    expect(shopping).toBeDefined();
    expect(shopping!.amount).toBeCloseTo(89.99, 2);
    expect(shopping!.transactionCount).toBe(1);

    expect(foodDrink).toBeDefined();
    expect(foodDrink!.amount).toBeCloseTo(73.50, 2); // 45.50 + 28.00
    expect(foodDrink!.transactionCount).toBe(2);

    expect(transport).toBeDefined();
    expect(transport!.amount).toBeCloseTo(32.00, 2);
    expect(transport!.transactionCount).toBe(1);
  });

  test('income-only category (Salary) does not appear in byCategory', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    const salaryEntry = result.byCategory.find(c => c.category === 'Salary');
    expect(salaryEntry).toBeUndefined();
  });
});

// ============================================================
// Scenario 2: Category percentages sum to 100%
// ============================================================
describe('ReportService.getSummary — category percentages', () => {
  test('percentages sum to ~100% (floating point tolerance)', () => {
    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    const total = result.byCategory.reduce((sum, c) => sum + c.percentage, 0);
    expect(Math.abs(total - 100)).toBeLessThan(0.01);
  });
});

// ============================================================
// Scenario 3: Month-on-month delta (Feb 2025 vs Jan 2025)
// Jan expenses = 195.49
// Feb expenses = 55 + 15 = 70
// Delta = ((70 - 195.49) / 195.49) * 100 ≈ -64.19%
// ============================================================
describe('ReportService.getSummary — month-on-month delta', () => {
  test('Feb 2025 previousMonth points to Jan 2025 with correct totalExpenses', () => {
    const service = makeService();
    const result = service.getSummary(2025, 2);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.previousMonth).toBeDefined();
    expect(result.previousMonth!.month).toBe('2025-01');
    expect(result.previousMonth!.totalExpenses).toBeCloseTo(195.49, 2);
  });

  test('Feb 2025 expenseDeltaPercent is approximately -64.19%', () => {
    const service = makeService();
    const result = service.getSummary(2025, 2);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    const expected = ((70 - 195.49) / 195.49) * 100;
    expect(result.previousMonth!.expenseDeltaPercent).toBeCloseTo(expected, 1);
  });

  test('January resolves previous month to December of prior year (year boundary)', () => {
    // Add a Dec 2024 transaction so previousMonth is populated for Jan
    store.transactions = [
      ...seedTransactions,
      {
        id: 'txn-dec-2024', amount: 100, type: 'expense', category: 'Utilities',
        description: 'December bill', date: '2024-12-15',
        createdAt: '2024-12-15T10:00:00.000Z',
      },
    ];

    const service = makeService();
    const result = service.getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.previousMonth).toBeDefined();
    expect(result.previousMonth!.month).toBe('2024-12');
    expect(result.previousMonth!.totalExpenses).toBeCloseTo(100, 2);
  });

  test('expenseDeltaPercent is null when previous month has transactions but zero expenses', () => {
    // Replace the prior-month data with income-only transactions
    store.transactions = [
      // Jan 2025 — income and expenses
      {
        id: 'txn-jan-inc', amount: 2500, type: 'income', category: 'Salary',
        description: 'January salary', date: '2025-01-15',
        createdAt: '2025-01-15T09:00:00.000Z',
      },
      // Feb 2025 — expenses (to have a "current" month)
      {
        id: 'txn-feb-exp', amount: 50, type: 'expense', category: 'Food & Drink',
        description: 'February groceries', date: '2025-02-10',
        createdAt: '2025-02-10T10:00:00.000Z',
      },
    ];

    const service = makeService();
    const result = service.getSummary(2025, 2);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    // Previous month (Jan) has transactions but zero expenses → delta = null
    expect(result.previousMonth).toBeDefined();
    expect(result.previousMonth!.expenseDeltaPercent).toBeNull();
  });
});

// ============================================================
// Scenario 4: Month outside 1–12 → INVALID_MONTH 400
// ============================================================
describe('ReportService.getSummary — invalid month', () => {
  test('month=0 returns INVALID_MONTH error', () => {
    const result = makeService().getSummary(2025, 0);
    expect(result).toMatchObject({
      code: 'INVALID_MONTH',
      statusCode: 400,
      error: 'Month must be between 1 and 12',
    });
  });

  test('month=13 returns INVALID_MONTH error', () => {
    const result = makeService().getSummary(2025, 13);
    expect(result).toMatchObject({ code: 'INVALID_MONTH', statusCode: 400 });
  });

  test('month=-1 returns INVALID_MONTH error', () => {
    const result = makeService().getSummary(2025, -1);
    expect(result).toMatchObject({ code: 'INVALID_MONTH', statusCode: 400 });
  });
});

// ============================================================
// Scenario 5: Missing params — handled by router before
// getSummary is called. Verified via the MISSING_PARAMS pattern
// already present in router.ts; tested at service boundary.
// The service itself does not validate missing params — it only
// validates month range. Coverage of MISSING_PARAMS is in router.
// ============================================================

// ============================================================
// Scenario 6: Month with no transactions → zero totals,
// empty byCategory array
// ============================================================
describe('ReportService.getSummary — month with no transactions', () => {
  test('returns zero totals and empty byCategory', () => {
    // March 2025 has no transactions in seed data
    const result = makeService().getSummary(2025, 3);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netAmount).toBe(0);
    expect(result.byCategory).toEqual([]);
  });

  test('month label is still correctly formatted when no transactions exist', () => {
    const result = makeService().getSummary(2025, 6);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');
    expect(result.month).toBe('2025-06');
  });
});

// ============================================================
// Scenario 7: Month with no previous month data →
// summary returned without previousMonth field
// ============================================================
describe('ReportService.getSummary — no previous month data', () => {
  test('previousMonth is absent when prior month has no transactions', () => {
    // Seed only March 2025 — February is empty
    store.transactions = [
      {
        id: 'txn-mar-001', amount: 500, type: 'income', category: 'Salary',
        description: 'March salary', date: '2025-03-15',
        createdAt: '2025-03-15T09:00:00.000Z',
      },
      {
        id: 'txn-mar-002', amount: 40, type: 'expense', category: 'Food & Drink',
        description: 'March groceries', date: '2025-03-10',
        createdAt: '2025-03-10T12:00:00.000Z',
      },
    ];

    const result = makeService().getSummary(2025, 3);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.previousMonth).toBeUndefined();
  });

  test('Jan 2025 with seed data has no previousMonth (Dec 2024 is empty)', () => {
    // Seed data has no Dec 2024 transactions — Jan previousMonth should be absent
    const result = makeService().getSummary(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlySummary');

    expect(result.previousMonth).toBeUndefined();
  });
});
