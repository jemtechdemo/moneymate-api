// ============================================================
// MoneyMate API — Transaction Tests
// ============================================================
// NOTE: The boundary date tests (marked with BUG) will FAIL
// until MM-42 is fixed. This is intentional for the demo.
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
  // BUG MM-42: These tests FAIL before the fix is applied.
  // The off-by-one error means last-day transactions are excluded.
  // ============================================================
  test('BUG MM-42: findByMonth includes transactions on the last day of the month', () => {
    const results = repo.findByMonth(2025, 1);
    const ids = results.map(t => t.id);
    // txn-004 and txn-005 are dated 2025-01-31 — they must be included
    expect(ids).toContain('txn-004'); // FAILS before fix
    expect(ids).toContain('txn-005'); // FAILS before fix
  });

  test('BUG MM-42: findByMonth returns all 5 January transactions', () => {
    const results = repo.findByMonth(2025, 1);
    expect(results).toHaveLength(5); // Returns 3 before fix
  });
});

describe('TransactionService', () => {
  const service = new TransactionService(new TransactionRepository());

  test('getMonthlyTotal returns error for invalid month', () => {
    const result = service.getMonthlyTotal(2025, 13);
    expect(result).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('getMonthlyTotal calculates income correctly', () => {
    const result = service.getMonthlyTotal(2025, 1);
    if ('statusCode' in result) throw new Error('Expected MonthlyTotalResult');
    expect(result.totalIncome).toBe(2500);
  });

  // ============================================================
  // BUG MM-42: Expense total is wrong before the fix.
  // Correct total: 45.50 + 32.00 + 89.99 + 28.00 = 195.49
  // Buggy total:   45.50 + 32.00               = 77.50
  // ============================================================
  test('BUG MM-42: getMonthlyTotal includes last-day expenses in total', () => {
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
