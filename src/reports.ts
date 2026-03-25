// ============================================================
// MoneyMate API — Reports Service
// ============================================================

import { Transaction, ApiError } from './types';
import { ITransactionRepository, TransactionRepository } from './transactions';
import { logger } from './logger';

export interface MonthlySummary {
  month: string;
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  byCategory: CategoryBreakdown[];
  previousMonth?: PreviousMonthDelta;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface PreviousMonthDelta {
  month: string;
  totalExpenses: number;
  expenseDeltaPercent: number | null;
}

// --------------- Repository Interface (SOLID: I, D) ---------------
// A focused read-only interface for the data the report service needs.
// This keeps ReportService decoupled from the full ITransactionRepository
// contract and only depends on the subset it uses.

export interface IReportRepository {
  getTransactionsForMonth(year: number, month: number): Transaction[];
}

// --------------- Repository Implementation ---------------
// Delegates to ITransactionRepository so there is a single data access
// implementation in the codebase (no duplication).

export class ReportRepository implements IReportRepository {
  constructor(private readonly txRepo: ITransactionRepository) {}

  getTransactionsForMonth(year: number, month: number): Transaction[] {
    return this.txRepo.findByMonth(year, month);
  }
}

// --------------- Service (SOLID: S, D) ---------------
// ReportService depends on IReportRepository (abstraction) injected via
// constructor — never instantiated with new inside the class body.

export class ReportService {
  constructor(private readonly repo: IReportRepository) {}

  getSummary(year: number, month: number): MonthlySummary | ApiError {
    if (month < 1 || month > 12) {
      return {
        error: 'Month must be between 1 and 12',
        code: 'INVALID_MONTH',
        statusCode: 400,
      };
    }

    const paddedMonth = String(month).padStart(2, '0');

    const currentTxns = this.repo.getTransactionsForMonth(year, month);

    const totalIncome = currentTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;

    // Build category breakdown from expense transactions only
    const expenseTxns = currentTxns.filter(t => t.type === 'expense');

    const categoryMap = new Map<string, { amount: number; count: number }>();
    for (const t of expenseTxns) {
      const existing = categoryMap.get(t.category);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        categoryMap.set(t.category, { amount: t.amount, count: 1 });
      }
    }

    const byCategory: CategoryBreakdown[] = [];
    for (const [category, { amount, count }] of categoryMap.entries()) {
      if (amount === 0) continue; // defensive: skip zero-amount categories
      const percentage =
        totalExpenses > 0
          ? Math.round((amount / totalExpenses) * 100 * 100) / 100
          : 0;
      byCategory.push({
        category,
        amount,
        percentage,
        transactionCount: count,
      });
    }

    byCategory.sort((a, b) => b.amount - a.amount);

    // Compute previous month coordinates
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;

    const prevTxns = this.repo.getTransactionsForMonth(prevYear, prevMonth);

    let previousMonth: PreviousMonthDelta | undefined;

    if (prevTxns.length > 0) {
      const prevTotalExpenses = prevTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const paddedPrevMonth = String(prevMonth).padStart(2, '0');

      const expenseDeltaPercent: number | null =
        prevTotalExpenses === 0
          ? null
          : Math.round(
              ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 * 100
            ) / 100;

      previousMonth = {
        month: `${prevYear}-${paddedPrevMonth}`,
        totalExpenses: prevTotalExpenses,
        expenseDeltaPercent,
      };
    }

    logger.info('Generating monthly summary', {
      year,
      month,
      transactionCount: currentTxns.length,
    });

    const summary: MonthlySummary = {
      month: `${year}-${paddedMonth}`,
      totalExpenses,
      totalIncome,
      netAmount,
      byCategory,
      ...(previousMonth !== undefined && { previousMonth }),
    };

    return summary;
  }
}

// --------------- Singleton export ---------------
export const reportService = new ReportService(
  new ReportRepository(new TransactionRepository())
);
