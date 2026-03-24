// ============================================================
// MoneyMate API — Reports Service
// ============================================================

import { z } from 'zod';
import { Transaction, ApiError } from './types';
import { ITransactionRepository, TransactionRepository } from './transactions';
import { logger } from './logger';

// --------------- Validation Schemas ---------------

export const ReportSummaryQuerySchema = z.object({
  year:  z.coerce.number().int().positive(),
  month: z.coerce.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
});

// --------------- Types ---------------

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;       // (amount / totalExpenses) * 100, rounded to 2 dp; 0 if totalExpenses === 0
  transactionCount: number;
}

export interface PreviousMonthDelta {
  month: string;                // YYYY-MM of prior calendar month
  totalExpenses: number;
  expenseDeltaPercent: number;  // ((current - previous) / previous) * 100, rounded to 2 dp; 0 if previous === 0
}

export interface MonthlySummary {
  month: string;                // YYYY-MM
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;            // totalIncome - totalExpenses
  byCategory: CategoryBreakdown[];
  previousMonth?: PreviousMonthDelta; // omitted if no prior month data
}

// --------------- Repository Interface (SOLID: I, D) ---------------

export interface IReportRepository {
  findByMonth(year: number, month: number): Transaction[];
}

// --------------- In-Memory Repository Implementation ---------------

export class InMemoryReportRepository implements IReportRepository {
  constructor(private readonly txnRepo: ITransactionRepository) {}

  findByMonth(year: number, month: number): Transaction[] {
    return this.txnRepo.findByMonth(year, month);
  }
}

// --------------- Service (SOLID: S, D) ---------------

export class ReportService {
  constructor(private readonly repo: IReportRepository) {}

  getSummary(year: number, month: number): MonthlySummary | ApiError {
    const parsed = ReportSummaryQuerySchema.safeParse({ year, month });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const issueCode = firstIssue?.code;

      if (issueCode === 'too_small' || issueCode === 'too_big') {
        return {
          error:      'Month must be between 1 and 12',
          code:       'INVALID_MONTH',
          statusCode: 400,
        };
      }

      // invalid_type, custom, or any other issue → MISSING_PARAMS
      return {
        error:      'year and month query params are required',
        code:       'MISSING_PARAMS',
        statusCode: 400,
      };
    }

    const { year: validYear, month: validMonth } = parsed.data;
    const transactions = this.repo.findByMonth(validYear, validMonth);

    const totalIncome   = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;

    const byCategory    = this.buildCategoryBreakdown(transactions, totalExpenses);
    const previousMonth = this.buildPreviousMonthDelta(validYear, validMonth, totalExpenses);

    const monthStr = `${validYear}-${String(validMonth).padStart(2, '0')}`;

    logger.info('Monthly summary generated', { month: monthStr, totalIncome, totalExpenses, netAmount });

    return {
      month:        monthStr,
      totalExpenses,
      totalIncome,
      netAmount,
      byCategory,
      ...(previousMonth !== undefined && { previousMonth }),
    };
  }

  private buildCategoryBreakdown(transactions: Transaction[], totalExpenses: number): CategoryBreakdown[] {
    const expenses = transactions.filter(t => t.type === 'expense');

    // Group by category
    const categoryMap = new Map<string, { amount: number; count: number }>();
    for (const txn of expenses) {
      const existing = categoryMap.get(txn.category);
      if (existing) {
        existing.amount += txn.amount;
        existing.count  += 1;
      } else {
        categoryMap.set(txn.category, { amount: txn.amount, count: 1 });
      }
    }

    const breakdown: CategoryBreakdown[] = [];
    for (const [category, { amount, count }] of categoryMap.entries()) {
      if (amount === 0) continue;

      const percentage = totalExpenses === 0
        ? 0
        : Math.round((amount / totalExpenses) * 10000) / 100;

      breakdown.push({ category, amount, percentage, transactionCount: count });
    }

    // Sort descending by amount
    breakdown.sort((a, b) => b.amount - a.amount);

    return breakdown;
  }

  private buildPreviousMonthDelta(year: number, month: number, currentExpenses: number): PreviousMonthDelta | undefined {
    const priorYear  = month === 1 ? year - 1 : year;
    const priorMonth = month === 1 ? 12 : month - 1;

    const priorTransactions = this.repo.findByMonth(priorYear, priorMonth);

    if (priorTransactions.length === 0) {
      return undefined;
    }

    const priorTotalExpenses = priorTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseDeltaPercent = priorTotalExpenses === 0
      ? 0
      : Math.round(((currentExpenses - priorTotalExpenses) / priorTotalExpenses) * 10000) / 100;

    const priorMonthStr = `${priorYear}-${String(priorMonth).padStart(2, '0')}`;

    return {
      month:               priorMonthStr,
      totalExpenses:       priorTotalExpenses,
      expenseDeltaPercent,
    };
  }
}

// --------------- Singleton export ---------------

export const reportService = new ReportService(
  new InMemoryReportRepository(new TransactionRepository())
);
