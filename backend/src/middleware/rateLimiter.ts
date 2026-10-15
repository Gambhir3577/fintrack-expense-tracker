import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in a few minutes.' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait a moment before sending another query.' },
});

export const syncLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 sync operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sync rate limit exceeded. Please try again shortly.' },
});
