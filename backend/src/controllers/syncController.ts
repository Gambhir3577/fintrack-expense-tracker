import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { syncService } from '../services/syncService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const pullQuerySchema = z.object({
  since: z.string().optional(),
});

export const pushBodySchema = z.object({
  transactions: z.array(z.any()).optional(),
  categories: z.array(z.any()).optional(),
  budgets: z.array(z.any()).optional(),
  recurringRules: z.array(z.any()).optional(),
  savingsGoals: z.array(z.any()).optional(),
  splitGroups: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export class SyncController {
  async pull(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const since = typeof req.query.since === 'string' ? req.query.since : undefined;
      const result = await syncService.pullChanges(req.user.id, since);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async push(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await syncService.pushChanges(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const syncController = new SyncController();
