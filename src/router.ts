// ============================================================
// MoneyMate API — Router
// ============================================================

import { Router, Request, Response } from 'express';
import { transactionService } from './transactions';
import { budgetService } from './budgets';
import { categoryService } from './categories';
import { reportService } from './reports';
import { ApiError } from './types';

const router = Router();

// Helper: check if result is an API error
function isApiError(result: unknown): result is ApiError {
  return typeof result === 'object' && result !== null && 'statusCode' in result;
}

// ---- Health ----
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'moneymate-api', timestamp: new Date().toISOString() });
});

// ---- Transactions ----
router.get('/transactions', (_req: Request, res: Response) => {
  const data = transactionService.getAll();
  res.json({ data });
});

// NOTE: specific routes must come BEFORE parameterised routes (:id)
router.get('/transactions/monthly-total', (req: Request, res: Response) => {
  const year  = parseInt(req.query.year  as string, 10);
  const month = parseInt(req.query.month as string, 10);

  if (isNaN(year) || isNaN(month)) {
    return res.status(400).json({ error: 'year and month query params are required', code: 'MISSING_PARAMS', statusCode: 400 });
  }

  const result = transactionService.getMonthlyTotal(year, month);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});

router.get('/transactions/:id', (req: Request, res: Response) => {
  const result = transactionService.getById(req.params.id);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});

router.post('/transactions', (req: Request, res: Response) => {
  const result = transactionService.create(req.body);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.status(201).json({ data: result, message: 'Transaction created successfully' });
});

// ---- Budgets ----
router.get('/budgets', (_req: Request, res: Response) => {
  const data = budgetService.getAll();
  res.json({ data });
});

router.get('/budgets/month/:month', (req: Request, res: Response) => {
  const result = budgetService.getByMonth(req.params.month);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});

router.post('/budgets', (req: Request, res: Response) => {
  const result = budgetService.create(req.body);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.status(201).json({ data: result, message: 'Budget created successfully' });
});

// ---- Categories ----
router.get('/categories', (_req: Request, res: Response) => {
  const data = categoryService.getAll();
  res.json({ data });
});

router.get('/categories/:id', (req: Request, res: Response) => {
  const result = categoryService.getById(req.params.id);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});

// ---- Reports ----
router.get('/reports/summary', (req: Request, res: Response) => {
  const year  = parseInt(req.query.year  as string, 10);
  const month = parseInt(req.query.month as string, 10);
  const result = reportService.getSummary(year, month);
  if (isApiError(result)) return res.status(result.statusCode).json(result);
  res.json({ data: result });
});

export default router;
