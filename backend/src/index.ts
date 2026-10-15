import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { rootRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet());

// Strict CORS Whitelist
const allowedOrigins = config.allowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === origin) return true;
        // Allow Vercel preview deployments (*.vercel.app)
        if (origin.endsWith('.vercel.app') && allowed.includes('vercel.app')) return true;
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not permitted by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers with safe limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root API Router
app.use('/api', rootRouter);

// Centralized sanitized error handling
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 FinTrack Backend running on port ${config.port} (${config.nodeEnv})`);
    console.log(`🔒 Allowed Origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
