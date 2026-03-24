// ============================================================
// MoneyMate API — Transactions Service
// ============================================================

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, MonthlyTotalResult, ApiError } from './types';
import { store } from './store';
import { logger } from './logger';

// --------------- Validation Schemas ---------------

export const CreateTransactionSchema = z.object({
  amount:      z.number().positive('Amount must be positive'),
  type:        z.enum(['income', 'expense']),
  category:    z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// --------------- Repository Interface (SOLID: D) ---------------

export interface ITransactionRepository {
  findAll(): Transaction[];
  findById(id: string): Transaction | undefined;
  findByMonth(year: number, month: number): Transaction[];
  create(input: CreateTransactionInput): Transaction;
}

// --------------- In-Memory Repository Implementation ---------------

export class TransactionRepository implements ITransactionRepository {
  findAll(): Transaction[] {
    return store.transactions;
  }

  findById(id: string): Transaction | undefined {
    return store.transactions.find(t => t.id === id);
  }

  findByMonth(year: number, month: number): Transaction[] {
    // Build start and end date strings for the requested month
    const paddedMonth = String(month).padStart(2, '0');
    const startDate = `${year}-${paddedMonth}-01`;

    // Calculate the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

    // ============================================================
    // BUG (MM-4): Off-by-one error on end date boundary.
    // The strict less-than operator ( < ) excludes transactions
    // that fall exactly on the last day of the month.
    // Fix: change the second condition from  < endDate  to  <= endDate
    // ============================================================
    return store.transactions.filter(t => t.date >= startDate && t.date < endDate);
  }

  create(input: CreateTransactionInput): Transaction {
    const newTransaction: Transaction = {
      id:          `txn-${uuidv4().slice(0, 8)}`,
      amount:      input.amount,
      type:        input.type,
      category:    input.category,
      description: input.description,
      date:        input.date,
      createdAt:   new Date().toISOString(),
    };
    store.transactions.push(newTransaction);
    return newTransaction;
  }
}

// --------------- Service (SOLID: S, D) ---------------

export class TransactionService {
  constructor(private readonly repo: ITransactionRepository) {}

  getAll(): Transaction[] {
    logger.info('Fetching all transactions');
    return this.repo.findAll();
  }

  getById(id: string): Transaction | ApiError {
    const transaction = this.repo.findById(id);
    if (!transaction) {
      return { error: 'Transaction not found', code: 'NOT_FOUND', statusCode: 404 };
    }
    return transaction;
  }

  getMonthlyTotal(year: number, month: number): MonthlyTotalResult | ApiError {
    if (month < 1 || month > 12) {
      return { error: 'Month must be between 1 and 12', code: 'INVALID_MONTH', statusCode: 400 };
    }

    const transactions = this.repo.findByMonth(year, month);
    logger.info('Calculating monthly total', { year, month, transactionCount: transactions.length });

    const totalIncome   = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      month:            `${year}-${String(month).padStart(2, '0')}`,
      year,
      totalIncome,
      totalExpenses,
      netAmount:        totalIncome - totalExpenses,
      transactionCount: transactions.length,
    };
  }

  create(input: unknown): Transaction | ApiError {
    const parsed = CreateTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error:      parsed.error.errors.map(e => e.message).join(', '),
        code:       'VALIDATION_ERROR',
        statusCode: 400,
      };
    }
    const transaction = this.repo.create(parsed.data);
    logger.info('Transaction created', { id: transaction.id });
    return transaction;
  }
}

// --------------- Singleton export ---------------
export const transactionService = new TransactionService(new TransactionRepository());
