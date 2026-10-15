import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { syncRouter } from './syncRoutes.js';
import { aiRouter } from './aiRoutes.js';
import { dataRouter } from './dataRoutes.js';

export const rootRouter = Router();

// Health check
rootRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'FinTrack AI Backend',
    timestamp: new Date().toISOString(),
  });
});

rootRouter.use('/auth', authRouter);
rootRouter.use('/sync', syncRouter);
rootRouter.use('/ai', aiRouter);
rootRouter.use('/data', dataRouter);
