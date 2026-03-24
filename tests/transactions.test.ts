// ============================================================
// MoneyMate API — Transaction Tests
// ============================================================
// NOTE: The boundary date tests (marked with BUG) will FAIL
// until MM-4 is fixed. This is intentional for the demo.
// ============================================================

import { TransactionRepository, TransactionService } from '../src/transactions';
import { store } from '../src/store';

// Reset the store before each test so tests are isolated
beforeEach(() => {
  store.transactions = [
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
    // Boundary date transactions — last day of January
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
  ];
});

describe('TransactionRepository', () => {
  const repo = new TransactionRepository();

  test('findAll returns all transactions', () => {
    expect(repo.findAll()).toHaveLength(5);
  });

  test('findById returns correct transaction', () => {
    const t = repo.findById('txn-001');
    expect(t).toBeDefined();
    expect(t?.amount).toBe(2500);
  });

  test('findById returns undefined for unknown id', () => {
    expect(repo.findById('does-not-exist')).toBeUndefined();
  });

  test('findByMonth returns mid-month transactions correctly', () => {
    const results = repo.findByMonth(2025, 1);
    // Mid-month txns are always included
    const ids = results.map(t => t.id);
    expect(ids).toContain('txn-001');
    expect(ids).toContain('txn-002');
    expect(ids).toContain('txn-003');
  });

  // ============================================================
  // BUG MM-4: These tests FAIL before the fix is applied.
  // The off-by-one error means last-day transactions are excluded.
  // ============================================================
  test('findByMonth includes transactions on the last day of the month', () => {
    const results = repo.findByMonth(2025, 1);
    const ids = results.map(t => t.id);
    // txn-004 and txn-005 are dated 2025-01-31 — they must be included
    expect(ids).toContain('txn-004'); // FAILS before fix
    expect(ids).toContain('txn-005'); // FAILS before fix
  });

  test('findByMonth returns all 5 January transactions', () => {
    const results = repo.findByMonth(2025, 1);
    expect(results).toHaveLength(5); // Returns 3 before fix
  });
});

describe('TransactionService', () => {
  const service = new TransactionService(new TransactionRepository());

  test('getMonthlyTotal returns error for invalid month', () => {
    const result = service.getMonthlyTotal(2025, 13);
    expect(result).toMatchObject({ code: 'INVALID_MONTH' });
  });

  test('getMonthlyTotal calculates income correctly', () => {
    const result = service.getMonthlyTotal(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalIncome).toBe(2500);
  });

  // ============================================================
  // BUG MM-4: Expense total is wrong before the fix.
  // Correct total: 45.50 + 32.00 + 89.99 + 28.00 = 195.49
  // Buggy total:   45.50 + 32.00               = 77.50
  // ============================================================
  test('getMonthlyTotal includes last-day expenses in total', () => {
    const result = service.getMonthlyTotal(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalExpenses).toBeCloseTo(195.49, 2); // FAILS before fix
    expect(result.transactionCount).toBe(5);             // FAILS before fix
  });

  test('create returns validation error for missing fields', () => {
    const result = service.create({ amount: -10 });
    expect(result).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('create successfully adds a transaction', () => {
    const result = service.create({
      amount: 100, type: 'expense', category: 'Food & Drink',
      description: 'Test transaction', date: '2025-01-20',
    });
    if ('statusCode' in result) throw new Error('Expected Transaction');
    expect(result.id).toMatch(/^txn-/);
    expect(result.amount).toBe(100);
  });
});

// ============================================================
// Additional boundary / edge-case tests for monthly-total
// date range logic (MM-4 related coverage)
// ============================================================

describe('TransactionRepository > date boundary edge cases', () => {
  beforeEach(() => { store.transactions = []; });
  const repo = new TransactionRepository();

  test('includes a transaction on the first day of the month', () => {
    // txn-003 is dated 2025-01-05 and txn-002 2025-01-10 — ensure the
    // very first calendar day (01) is also included when it exists.
    store.transactions = [
      {
        id: 'txn-first', amount: 10, type: 'expense', category: 'Food & Drink',
        description: 'First day coffee', date: '2025-01-01',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2025, 1);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('txn-first');
  });

  test('excludes transactions from the previous month', () => {
    store.transactions = [
      {
        id: 'txn-prev', amount: 50, type: 'expense', category: 'Food & Drink',
        description: 'December purchase', date: '2024-12-31',
        createdAt: '2024-12-31T10:00:00.000Z',
      },
      {
        id: 'txn-curr', amount: 20, type: 'expense', category: 'Transport',
        description: 'January trip', date: '2025-01-15',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2025, 1);
    const ids = results.map(t => t.id);
    expect(ids).not.toContain('txn-prev');
    expect(ids).toContain('txn-curr');
  });

  test('excludes transactions from the following month', () => {
    store.transactions = [
      {
        id: 'txn-curr', amount: 20, type: 'expense', category: 'Transport',
        description: 'January trip', date: '2025-01-15',
        createdAt: '2025-01-15T10:00:00.000Z',
      },
      {
        id: 'txn-next', amount: 80, type: 'expense', category: 'Shopping',
        description: 'February purchase', date: '2025-02-01',
        createdAt: '2025-02-01T10:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2025, 1);
    const ids = results.map(t => t.id);
    expect(ids).toContain('txn-curr');
    expect(ids).not.toContain('txn-next');
  });

  test('returns empty array when no transactions exist in requested month', () => {
    store.transactions = [
      {
        id: 'txn-other', amount: 100, type: 'income', category: 'Salary',
        description: 'March salary', date: '2025-03-15',
        createdAt: '2025-03-15T09:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2025, 1);
    expect(results).toHaveLength(0);
  });

  test('includes a transaction on 29 February in a leap year', () => {
    store.transactions = [
      {
        id: 'txn-leap', amount: 29, type: 'expense', category: 'Food & Drink',
        description: 'Leap day lunch', date: '2024-02-29',
        createdAt: '2024-02-29T12:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2024, 2);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('txn-leap');
  });

  test('handles December correctly — includes 31 Dec and excludes 1 Jan of next year', () => {
    store.transactions = [
      {
        id: 'txn-dec31', amount: 99, type: 'expense', category: 'Shopping',
        description: 'New Year Eve shopping', date: '2025-12-31',
        createdAt: '2025-12-31T18:00:00.000Z',
      },
      {
        id: 'txn-jan1', amount: 10, type: 'expense', category: 'Food & Drink',
        description: 'New Year Day coffee', date: '2026-01-01',
        createdAt: '2026-01-01T09:00:00.000Z',
      },
    ];
    const results = repo.findByMonth(2025, 12);
    const ids = results.map(t => t.id);
    expect(ids).toContain('txn-dec31');
    expect(ids).not.toContain('txn-jan1');
  });
});

describe('TransactionService > date boundary edge cases', () => {
  beforeEach(() => { store.transactions = []; });
  const service = new TransactionService(new TransactionRepository());

  test('getMonthlyTotal returns 0 income and 0 expenses for a month with no transactions', () => {
    store.transactions = [];
    const result = service.getMonthlyTotal(2025, 6);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netAmount).toBe(0);
    expect(result.transactionCount).toBe(0);
  });

  test('getMonthlyTotal includes a leap-year 29 Feb transaction in the expense total', () => {
    store.transactions = [
      {
        id: 'txn-leap-exp', amount: 55.50, type: 'expense', category: 'Shopping',
        description: 'Leap day treat', date: '2024-02-29',
        createdAt: '2024-02-29T15:00:00.000Z',
      },
    ];
    const result = service.getMonthlyTotal(2024, 2);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalExpenses).toBeCloseTo(55.50, 2);
    expect(result.transactionCount).toBe(1);
  });

  test('getMonthlyTotal includes 31 Dec transaction in December total (year boundary)', () => {
    store.transactions = [
      {
        id: 'txn-dec-income', amount: 3000, type: 'income', category: 'Salary',
        description: 'December salary', date: '2025-12-31',
        createdAt: '2025-12-31T09:00:00.000Z',
      },
    ];
    const result = service.getMonthlyTotal(2025, 12);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalIncome).toBe(3000);
    expect(result.transactionCount).toBe(1);
    expect(result.month).toBe('2025-12');
  });

  test('getMonthlyTotal returns error for month 0 (below valid range)', () => {
    const result = service.getMonthlyTotal(2025, 0);
    expect(result).toMatchObject({ code: 'INVALID_MONTH', statusCode: 400 });
  });
});
