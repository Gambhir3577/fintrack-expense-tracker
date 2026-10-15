import { Router } from 'express';
import {
  authController,
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../controllers/authController.js';
import { validateBody } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post('/login', authLimiter, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.post('/refresh', authLimiter, validateBody(refreshSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

authRouter.post('/logout', validateBody(logoutSchema), (req, res, next) =>
  authController.logout(req, res, next)
);

authRouter.get('/me', requireAuth, (req, res, next) =>
  authController.me(req, res, next)
);
