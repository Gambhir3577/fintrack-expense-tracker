import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

export interface FinancialContextDTO {
  baseCurrency?: string;
  netBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  savingsRate?: number;
  topExpenseCategories?: Array<{ name?: string; amount?: number; category?: { name: string } }>;
  overBudgetCategories?: Array<{ name?: string; category?: { name: string }; excess?: number; limit?: number }>;
  daysRemainingInMonth?: number;
}

export interface ReceiptOCRResult {
  merchant: string;
  amount: number;
  date: string;
  tax?: number;
  categoryName: string;
  confidence: number;
  rawText?: string;
}

export class AIService {
  private getClient(): GoogleGenerativeAI {
    if (!config.gemini.apiKey) {
      const error: any = new Error(
        'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in the backend environment.'
      );
      error.status = 503;
      throw error;
    }
    return new GoogleGenerativeAI(config.gemini.apiKey);
  }

  async askAdvisor(prompt: string, ctx?: FinancialContextDTO): Promise<string> {
    const ai = this.getClient();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const topList = ctx?.topExpenseCategories
      ?.map((c) => `${c.category?.name || c.name}: ${c.amount}`)
      .join(', ') || 'None';

    const overList = ctx?.overBudgetCategories
      ?.map((c) => `${c.category?.name || c.name} (exceeded by ${c.excess})`)
      .join(', ') || 'None';

    const systemContext = `You are FinTrack AI, a precise, helpful, and privacy-first personal financial advisor.
Current User Financial Context:
- Base Currency: ${ctx?.baseCurrency || 'INR'}
- Net Balance: ${ctx?.netBalance ?? 'N/A'}
- Monthly Income: ${ctx?.monthlyIncome ?? 'N/A'}
- Monthly Expenses: ${ctx?.monthlyExpense ?? 'N/A'}
- Savings Rate: ${ctx?.savingsRate ?? 0}%
- Top Expenses: ${topList}
- Over-budget Categories: ${overList}
- Days remaining in month: ${ctx?.daysRemainingInMonth ?? 15}

Respond concisely with clear markdown formatting. Be encouraging, quantitative, and give actionable financial guidance.`;

    try {
      const result = await model.generateContent([
        { text: `${systemContext}\n\nUser Question: ${prompt}` },
      ]);
      const response = await result.response;
      return response.text() || 'No response generated from Gemini.';
    } catch (err: any) {
      console.error('Gemini Advisor Error:', err.message);
      const error: any = new Error(`AI service failed: ${err.message}`);
      error.status = 502;
      throw error;
    }
  }

  async processReceiptImage(
    imageBuffer: Buffer,
    mimeType: string,
    currency = 'INR'
  ): Promise<ReceiptOCRResult> {
    const ai = this.getClient();
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analyze this receipt / invoice image and extract structured financial details.
Return ONLY a valid JSON object matching this schema:
{
  "merchant": string (business/store name, default to "Retail Merchant" if unknown),
  "amount": number (final total amount paid as a positive number),
  "date": string (ISO date format YYYY-MM-DD, or current date if unreadable),
  "tax": number (total tax or GST if present, else null),
  "categoryName": string (best matching category from: Food & Dining, Groceries, Transportation, Housing & Rent, Utilities & Bills, Entertainment, Shopping, Healthcare, Education, Investments),
  "confidence": number (between 0.0 and 1.0 indicating confidence score),
  "rawText": string (a concise summary of lines found on the receipt)
}`;

    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return {
          merchant: parsed.merchant || 'Retail Merchant',
          amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
          date: parsed.date || new Date().toISOString().split('T')[0],
          tax: typeof parsed.tax === 'number' ? parsed.tax : undefined,
          categoryName: parsed.categoryName || 'Food & Dining',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
          rawText: parsed.rawText || '',
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output:', text);
        return {
          merchant: 'Scanned Merchant',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          categoryName: 'Food & Dining',
          confidence: 0.5,
          rawText: text,
        };
      }
    } catch (err: any) {
      console.error('Gemini Receipt OCR Error:', err.message);
      const error: any = new Error(`Receipt OCR failed: ${err.message}`);
      error.status = 502;
      throw error;
    }
  }
}

export const aiService = new AIService();
