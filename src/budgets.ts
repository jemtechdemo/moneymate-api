// ============================================================
// MoneyMate API — Budgets Service
// ============================================================

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Budget, ApiError } from './types';
import { store } from './store';
import { logger } from './logger';

export const CreateBudgetSchema = z.object({
  category:    z.string().min(1, 'Category is required'),
  limitAmount: z.number().positive('Limit must be positive'),
  month:       z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;

export interface IBudgetRepository {
  findAll(): Budget[];
  findByMonth(month: string): Budget[];
  findById(id: string): Budget | undefined;
  create(input: CreateBudgetInput): Budget;
}

export class BudgetRepository implements IBudgetRepository {
  findAll(): Budget[] {
    return store.budgets;
  }

  findByMonth(month: string): Budget[] {
    return store.budgets.filter(b => b.month === month);
  }

  findById(id: string): Budget | undefined {
    return store.budgets.find(b => b.id === id);
  }

  create(input: CreateBudgetInput): Budget {
    const budget: Budget = {
      id:          `bud-${uuidv4().slice(0, 8)}`,
      category:    input.category,
      limitAmount: input.limitAmount,
      month:       input.month,
      createdAt:   new Date().toISOString(),
    };
    store.budgets.push(budget);
    return budget;
  }
}

export class BudgetService {
  constructor(private readonly repo: IBudgetRepository) {}

  getAll(): Budget[] {
    logger.info('Fetching all budgets');
    return this.repo.findAll();
  }

  getByMonth(month: string): Budget[] | ApiError {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return { error: 'Month must be in YYYY-MM format', code: 'INVALID_MONTH', statusCode: 400 };
    }
    return this.repo.findByMonth(month);
  }

  create(input: unknown): Budget | ApiError {
    const parsed = CreateBudgetSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error:      parsed.error.errors.map(e => e.message).join(', '),
        code:       'VALIDATION_ERROR',
        statusCode: 400,
      };
    }
    const budget = this.repo.create(parsed.data);
    logger.info('Budget created', { id: budget.id });
    return budget;
  }
}

export const budgetService = new BudgetService(new BudgetRepository());
