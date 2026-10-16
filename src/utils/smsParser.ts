import { Category } from '../types';

export interface RawSmsMessage {
  id: string;
  sender: string;
  body: string;
  date: number; // timestamp in ms
}

export interface ParsedDraftTransaction {
  id: string;
  smsId: string;
  sender: string;
  rawText: string;
  amount: number;
  type: 'expense' | 'income';
  merchant: string;
  accountDigits?: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  confidence: number;
}

// Common merchant keyword to category matching
const MERCHANT_CATEGORY_RULES: Array<{ keywords: string[]; categoryId: string; categoryName: string }> = [
  {
    keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonald', 'burger', 'pizza', 'starbucks', 'kfc', 'subway', 'dine', 'baker', 'eats'],
    categoryId: 'cat-food',
    categoryName: 'Food & Dining',
  },
  {
    keywords: ['blinkit', 'zepto', 'instamart', 'bigbasket', 'grocery', 'supermarket', 'mart', 'dmart', 'kirana', 'spencer', 'reliance fresh'],
    categoryId: 'cat-groceries',
    categoryName: 'Groceries',
  },
  {
    keywords: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'hpcl', 'bpcl', 'ioc', 'shell', 'parking', 'toll', 'fastag', 'indigo', 'irctc', 'railways'],
    categoryId: 'cat-transport',
    categoryName: 'Transportation',
  },
  {
    keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'shopping', 'retail', 'clothing', 'ajio', 'nykaa', 'tata cliq'],
    categoryId: 'cat-shopping',
    categoryName: 'Shopping',
  },
  {
    keywords: ['electricity', 'bescom', 'tata power', 'water', 'gas', 'broadband', 'wifi', 'airtel', 'jio', 'vi ', 'vodafone', 'billdesk', 'recharge'],
    categoryId: 'cat-utilities',
    categoryName: 'Utilities & Bills',
  },
  {
    keywords: ['netflix', 'spotify', 'hotstar', 'prime video', 'cinema', 'pvr', 'inox', 'theatre', 'movie', 'steam', 'playstation'],
    categoryId: 'cat-entertainment',
    categoryName: 'Entertainment',
  },
  {
    keywords: ['salary', 'payroll', 'dividend', 'interest', 'stipend'],
    categoryId: 'cat-income',
    categoryName: 'Income',
  },
];

/**
 * Parses a single SMS body into a draft transaction on-device.
 * Returns null if the SMS is not a financial transaction (e.g. OTP, spam, marketing).
 */
export function parseSingleSms(
  sms: RawSmsMessage,
  categories: Category[] = []
): ParsedDraftTransaction | null {
  const text = sms.body;
  const lower = text.toLowerCase();

  // 1. Filter out OTPs, verification codes, and promo messages
  if (
    lower.includes('otp') ||
    lower.includes('verification code') ||
    lower.includes('one time password') ||
    lower.includes('do not share') ||
    lower.includes('pre-approved') ||
    lower.includes('apply now') ||
    lower.includes('loan offer')
  ) {
    return null;
  }

  // 2. Determine Transaction Type (debit / credit)
  const isDebit =
    lower.includes('debited') ||
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('transferred to') ||
    lower.includes('sent') ||
    lower.includes('withdrawn') ||
    lower.includes('deducted') ||
    lower.includes('purchase of');

  const isCredit =
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('deposited') ||
    lower.includes('refund') ||
    lower.includes('cashback') ||
    lower.includes('added to your');

  if (!isDebit && !isCredit) {
    return null; // Not a confirmed transaction
  }

  const type: 'expense' | 'income' = isCredit ? 'income' : 'expense';

  // 3. Extract Amount
  // Matches: ₹1,500.00, Rs. 450, INR 3,499.50, $45.00
  const amountRegex = /(?:rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const matchAmount = text.match(amountRegex);
  if (!matchAmount) {
    return null;
  }

  const rawAmountNum = parseFloat(matchAmount[1].replace(/,/g, ''));
  if (isNaN(rawAmountNum) || rawAmountNum <= 0) {
    return null;
  }

  // 4. Extract Account Digits (e.g. A/c ending XX1234 or card XX9081)
  const accountRegex = /(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s*)?(?:xx|x|\*)*(\d{3,4})/i;
  const matchAccount = text.match(accountRegex);
  const accountDigits = matchAccount ? matchAccount[1] : undefined;

  // 5. Extract Merchant or Beneficiary
  let merchant = '';

  const merchantRegex = /(?:at|to|info|vpa|towards)\s+([A-Za-z0-9\s\.\-@&]{2,30}?)(?:\s+on|\s+ref|\s+upi|\s+avl|\s+bal|\s+ending|\.|\n|$)/i;
  const matchMerchant = text.match(merchantRegex);

  if (matchMerchant && matchMerchant[1]) {
    const rawCandidate = matchMerchant[1].trim();
    if (
      !rawCandidate.toLowerCase().includes('your account') &&
      !rawCandidate.toLowerCase().includes('a/c') &&
      rawCandidate.length > 2
    ) {
      merchant = rawCandidate.replace(/\s+/g, ' ');
    }
  }

  if (!merchant) {
    // Fallback: Sender Bank / Service name from SMS header (e.g., "VM-HDFCBK" -> "HDFC Bank")
    const cleanSender = sms.sender.replace(/^[A-Za-z]{2}-/, '').toUpperCase();
    merchant = isDebit ? `${cleanSender} Transaction` : `${cleanSender} Credit`;
  }

  // 6. Match Category
  let categoryId = type === 'income' ? 'cat-income' : 'cat-food';
  let categoryName = type === 'income' ? 'Income' : 'Food & Dining';

  const merchantLower = merchant.toLowerCase();
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => merchantLower.includes(kw) || lower.includes(kw))) {
      categoryId = rule.categoryId;
      categoryName = rule.categoryName;
      break;
    }
  }

  // Match against user's actual categories if available
  const existingCat = categories.find((c) => c.id === categoryId || c.name.toLowerCase() === categoryName.toLowerCase());
  if (existingCat) {
    categoryId = existingCat.id;
    categoryName = existingCat.name;
  }

  // 7. Parse Date
  let dateStr = new Date().toISOString().split('T')[0];
  if (sms.date) {
    try {
      dateStr = new Date(sms.date).toISOString().split('T')[0];
    } catch {
      // Keep today
    }
  }

  return {
    id: `sms-draft-${sms.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    smsId: sms.id || String(Date.now()),
    sender: sms.sender,
    rawText: text,
    amount: rawAmountNum,
    type,
    merchant,
    accountDigits,
    date: dateStr,
    categoryId,
    categoryName,
    confidence: 0.95,
  };
}

/**
 * Batch parses an array of SMS messages, filtering out duplicates and invalid messages.
 */
export function parseSmsBatch(
  messages: RawSmsMessage[],
  categories: Category[] = []
): ParsedDraftTransaction[] {
  const drafts: ParsedDraftTransaction[] = [];
  const seenSignatures = new Set<string>();

  for (const msg of messages) {
    const draft = parseSingleSms(msg, categories);
    if (draft) {
      // Deduplicate identical amounts, dates, and merchants
      const signature = `${draft.date}-${draft.amount}-${draft.merchant.toLowerCase()}`;
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        drafts.push(draft);
      }
    }
  }

  return drafts;
}
