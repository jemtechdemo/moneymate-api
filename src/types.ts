// ============================================================
// MoneyMate API — Shared Types
// ============================================================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO 8601 date string: YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  month: string; // Format: YYYY-MM
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  colour: string;
}

export interface MonthlyTotalResult {
  month: string;       // Format: YYYY-MM
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}
