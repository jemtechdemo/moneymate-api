// ============================================================
// MoneyMate API — In-Memory Data Store
// Replaces a real DB for demo purposes.
// ============================================================

import { Transaction, Budget, Category } from './types';

export const store: {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
} = {
  categories: [
    { id: 'cat-1', name: 'Food & Drink',    colour: '#FF6B6B' },
    { id: 'cat-2', name: 'Transport',        colour: '#4ECDC4' },
    { id: 'cat-3', name: 'Entertainment',    colour: '#45B7D1' },
    { id: 'cat-4', name: 'Utilities',        colour: '#96CEB4' },
    { id: 'cat-5', name: 'Salary',           colour: '#88D8B0' },
    { id: 'cat-6', name: 'Shopping',         colour: '#FFEAA7' },
  ],
  budgets: [
    {
      id: 'bud-1',
      category: 'Food & Drink',
      limitAmount: 300,
      month: '2025-01',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'bud-2',
      category: 'Transport',
      limitAmount: 150,
      month: '2025-01',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  transactions: [
    // Mid-month transactions (these always work fine)
    {
      id: 'txn-001', amount: 2500, type: 'income',  category: 'Salary',
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
    // BOUNDARY DATE TRANSACTIONS — last day of month
    // BUG: These are excluded from monthly totals due to the off-by-one
    // error in getMonthlyTotal(). They should be included.
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
    // February transactions
    {
      id: 'txn-006', amount: 2500, type: 'income',  category: 'Salary',
      description: 'February salary', date: '2025-02-15',
      createdAt: '2025-02-15T09:00:00.000Z',
    },
    {
      id: 'txn-007', amount: 55.00, type: 'expense', category: 'Utilities',
      description: 'Electric bill', date: '2025-02-20',
      createdAt: '2025-02-20T10:00:00.000Z',
    },
    // Feb boundary — last day (28th in 2025)
    {
      id: 'txn-008', amount: 15.00, type: 'expense', category: 'Entertainment',
      description: 'Streaming subscription', date: '2025-02-28',
      createdAt: '2025-02-28T00:00:00.000Z',
    },
  ],
};
