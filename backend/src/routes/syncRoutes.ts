import { Router } from 'express';
import { syncController, pullQuerySchema, pushBodySchema } from '../controllers/syncController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateQuery, validateBody } from '../middleware/validation.js';
import { syncLimiter } from '../middleware/rateLimiter.js';

export const syncRouter = Router();

syncRouter.use(requireAuth);
syncRouter.use(syncLimiter);

syncRouter.get('/pull', validateQuery(pullQuerySchema), (req, res, next) =>
  syncController.pull(req, res, next)
);

syncRouter.post('/push', validateBody(pushBodySchema), (req, res, next) =>
  syncController.push(req, res, next)
);
