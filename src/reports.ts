// ============================================================
// MoneyMate API — Reports Service
// ============================================================
// STATUS: Stub — implementation coming in Epic MM-50.
// The GET /reports/summary endpoint will provide monthly
// spending summaries grouped by category with month-on-month
// percentage deltas.
// ============================================================

import { ApiError } from './types';
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
  expenseDeltaPercent: number;
}

export class ReportService {
  getSummary(_year: number, _month: number): MonthlySummary | ApiError {
    logger.warn('Reports endpoint not yet implemented — see Epic MM-50');
    return {
      error:      'Reports feature not yet implemented',
      code:       'NOT_IMPLEMENTED',
      statusCode: 501,
    };
  }
}

export const reportService = new ReportService();
