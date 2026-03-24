// ============================================================
// MoneyMate API — Entry Point
// ============================================================

import express from 'express';
import router from './router';
import { logger } from './logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', router);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND', statusCode: 404 });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR', statusCode: 500 });
});

app.listen(PORT, () => {
  logger.info(`MoneyMate API running`, { port: PORT });
});

export default app;
