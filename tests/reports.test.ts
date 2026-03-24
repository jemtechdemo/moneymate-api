// ============================================================
// MoneyMate API — Reports Service Tests (MM-9)
// ============================================================

import { ReportService, InMemoryReportRepository } from '../src/reports';
import { TransactionRepository } from '../src/transactions';
import { store } from '../src/store';

// Reset the store before each test so tests are isolated
beforeEach(() => {
  store.transactions = [];
});

function makeService(): ReportService {
  return new ReportService(new InMemoryReportRepository(new TransactionRepository()));
}

// --------------- Scenario 1: Happy path ---------------

describe('ReportService > happy path', () => {
  test('returns correct totals, byCategory, and previousMonth when data exists', () => {
    store.transactions = [
      // Prior month (Feb 2025) — expenses only
      { id: 'p-1', amount: 100, type: 'expense', category: 'Food & Drink', description: 'Feb food', date: '2025-02-10', createdAt: '2025-02-10T10:00:00.000Z' },
      // Current month (Mar 2025) — income + 2 expense categories
      { id: 'c-1', amount: 2000, type: 'income',  category: 'Salary',       description: 'March salary', date: '2025-03-15', createdAt: '2025-03-15T09:00:00.000Z' },
      { id: 'c-2', amount: 50,   type: 'expense', category: 'Food & Drink', description: 'Groceries',   date: '2025-03-10', createdAt: '2025-03-10T12:00:00.000Z' },
      { id: 'c-3', amount: 30,   type: 'expense', category: 'Transport',    description: 'Bus pass',     date: '2025-03-05', createdAt: '2025-03-05T08:00:00.000Z' },
    ];

    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');

    expect(result.totalIncome).toBe(2000);
    expect(result.totalExpenses).toBe(80);
    expect(result.netAmount).toBe(1920);
    expect(result.byCategory).toHaveLength(2);
    expect(result.previousMonth).toBeDefined();
  });
});

// --------------- Scenario 2: Category percentages sum to 100% ---------------

describe('ReportService > category percentages', () => {
  test('percentages across all categories sum to approximately 100%', () => {
    store.transactions = [
      { id: 'e-1', amount: 60, type: 'expense', category: 'Food & Drink', description: 'Groceries', date: '2025-03-10', createdAt: '2025-03-10T10:00:00.000Z' },
      { id: 'e-2', amount: 40, type: 'expense', category: 'Transport',    description: 'Bus',       date: '2025-03-12', createdAt: '2025-03-12T10:00:00.000Z' },
    ];

    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');

    const total = result.byCategory.reduce((s, c) => s + c.percentage, 0);
    expect(total).toBeCloseTo(100, 1);
  });
});

// --------------- Scenario 3: Month-on-month delta ---------------

describe('ReportService > month-on-month delta', () => {
  test('delta is +50% when current expenses are 150 and prior are 100', () => {
    store.transactions = [
      { id: 'p-1', amount: 100, type: 'expense', category: 'Food & Drink', description: 'Prior food',    date: '2025-02-10', createdAt: '2025-02-10T10:00:00.000Z' },
      { id: 'c-1', amount: 150, type: 'expense', category: 'Food & Drink', description: 'Current food',  date: '2025-03-10', createdAt: '2025-03-10T10:00:00.000Z' },
    ];

    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');
    expect(result.previousMonth?.expenseDeltaPercent).toBeCloseTo(50, 1);
  });

  test('delta is -50% when current expenses are 100 and prior are 200', () => {
    store.transactions = [
      { id: 'p-1', amount: 200, type: 'expense', category: 'Food & Drink', description: 'Prior food',   date: '2025-02-10', createdAt: '2025-02-10T10:00:00.000Z' },
      { id: 'c-1', amount: 100, type: 'expense', category: 'Food & Drink', description: 'Current food', date: '2025-03-10', createdAt: '2025-03-10T10:00:00.000Z' },
    ];

    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');
    expect(result.previousMonth?.expenseDeltaPercent).toBeCloseTo(-50, 1);
  });
});

// --------------- Scenario 4: MISSING_PARAMS ---------------

describe('ReportService > MISSING_PARAMS', () => {
  test('returns MISSING_PARAMS when year is NaN', () => {
    const service = makeService();
    const result  = service.getSummary(NaN, 1);
    expect(result).toMatchObject({ code: 'MISSING_PARAMS', statusCode: 400 });
  });

  test('returns MISSING_PARAMS when month is NaN', () => {
    const service = makeService();
    const result  = service.getSummary(2025, NaN);
    expect(result).toMatchObject({ code: 'MISSING_PARAMS', statusCode: 400 });
  });
});

// --------------- Scenario 5: INVALID_MONTH ---------------

describe('ReportService > INVALID_MONTH', () => {
  test('returns INVALID_MONTH for month 0 (below range)', () => {
    const service = makeService();
    const result  = service.getSummary(2025, 0);
    expect(result).toMatchObject({ code: 'INVALID_MONTH', statusCode: 400 });
  });

  test('returns INVALID_MONTH for month 13 (above range)', () => {
    const service = makeService();
    const result  = service.getSummary(2025, 13);
    expect(result).toMatchObject({ code: 'INVALID_MONTH', statusCode: 400 });
  });
});

// --------------- Scenario 6: No transactions ---------------

describe('ReportService > no transactions', () => {
  test('returns zero totals and empty byCategory when store is empty', () => {
    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');

    expect(result.totalExpenses).toBe(0);
    expect(result.totalIncome).toBe(0);
    expect(result.netAmount).toBe(0);
    expect(result.byCategory).toEqual([]);
  });
});

// --------------- Scenario 7: No prior month data ---------------

describe('ReportService > no prior month data', () => {
  test('previousMonth is absent when only current month has transactions', () => {
    store.transactions = [
      { id: 'c-1', amount: 50, type: 'expense', category: 'Food & Drink', description: 'Groceries', date: '2025-03-10', createdAt: '2025-03-10T10:00:00.000Z' },
    ];

    const service = makeService();
    const result  = service.getSummary(2025, 3);

    if ('statusCode' in result) throw new Error('Expected MonthlySummary, got ApiError');
    expect('previousMonth' in result).toBe(false);
  });
});
