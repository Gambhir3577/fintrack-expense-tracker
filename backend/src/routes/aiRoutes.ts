import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { aiController, advisorInputSchema } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB image limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are supported for receipt scanning.'));
    }
  },
});

aiRouter.use(requireAuth);
aiRouter.use(aiLimiter);

// AI Advisor Prompt
aiRouter.post('/advisor', validateBody(advisorInputSchema), (req, res, next) =>
  aiController.askAdvisor(req, res, next)
);

// Receipt OCR (File upload or Base64 JSON)
aiRouter.post(
  '/receipt-ocr',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'Receipt image exceeds 5MB limit. Please upload a smaller image.' });
          return;
        }
        res.status(400).json({ error: err.message || 'Image upload failed' });
        return;
      }
      next();
    });
  },
  (req, res, next) => aiController.processReceiptFile(req, res, next)
);
