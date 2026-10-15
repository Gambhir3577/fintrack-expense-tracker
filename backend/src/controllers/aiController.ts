import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from '../services/aiService.js';
import { AuthenticatedRequest } from '../types/index.js';

export const advisorInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(3000, 'Prompt exceeds maximum length of 3000 characters'),
  context: z.record(z.any()).optional(),
});

export const base64ReceiptSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
  mimeType: z.string().default('image/jpeg'),
  currency: z.string().optional(),
});

export class AIController {
  async askAdvisor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to use AI Advisor' });
        return;
      }

      const { prompt, context } = req.body;
      const reply = await aiService.askAdvisor(prompt, context);
      res.status(200).json({ response: reply });
    } catch (err) {
      next(err);
    }
  }

  async processReceiptFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required for Receipt OCR' });
        return;
      }

      const file = req.file;
      const currency = (req.body?.currency as string) || 'INR';

      if (file) {
        const result = await aiService.processReceiptImage(file.buffer, file.mimetype, currency);
        res.status(200).json(result);
        return;
      }

      // Check for base64 fallback in json body
      if (req.body?.imageBase64) {
        const parsed = base64ReceiptSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: 'Invalid receipt image data' });
          return;
        }

        const buffer = Buffer.from(parsed.data.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const result = await aiService.processReceiptImage(buffer, parsed.data.mimeType, parsed.data.currency || currency);
        res.status(200).json(result);
        return;
      }

      res.status(400).json({ error: 'No receipt image provided. Please upload an image file or provide imageBase64.' });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AIController();
