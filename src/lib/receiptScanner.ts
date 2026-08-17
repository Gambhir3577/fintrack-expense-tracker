import { Category, ReceiptScanResult, SupportedCurrency } from '../types';
import { format } from 'date-fns';

/**
 * Known merchant database with category mappings and regex patterns
 */
const KNOWN_MERCHANTS: Array<{
  name: string;
  categoryId: string;
  keywords: string[];
}> = [
  // Food & Dining
  { name: 'Starbucks Coffee', categoryId: 'cat-food', keywords: ['starbucks', 'coffee', 'frappuccino', 'latte', 'espresso'] },
  { name: 'McDonald\'s', categoryId: 'cat-food', keywords: ['mcdonald', 'mcd', 'burger', 'mcspicy', 'mccafe'] },
  { name: 'Domino\'s Pizza', categoryId: 'cat-food', keywords: ['dominos', 'domino\'s', 'pizza', 'garlic bread'] },
  { name: 'Swiggy', categoryId: 'cat-food', keywords: ['swiggy', 'swiggy instamart', 'bundl technologies'] },
  { name: 'Zomato', categoryId: 'cat-food', keywords: ['zomato', 'zomato delivery', 'feeding india'] },
  { name: 'Subway', categoryId: 'cat-food', keywords: ['subway', 'sub', 'sandwich'] },
  { name: 'KFC', categoryId: 'cat-food', keywords: ['kfc', 'kentucky', 'fried chicken', 'zinger'] },
  { name: 'Blue Tokai', categoryId: 'cat-food', keywords: ['blue tokai', 'coffee roasters'] },
  { name: 'Haldiram\'s', categoryId: 'cat-food', keywords: ['haldiram', 'haldirams', 'sweets', 'thali'] },

  // Groceries
  { name: 'Blinkit', categoryId: 'cat-groceries', keywords: ['blinkit', 'grofers', 'blink commerce'] },
  { name: 'Zepto', categoryId: 'cat-groceries', keywords: ['zepto', 'kirana kart'] },
  { name: 'BigBasket', categoryId: 'cat-groceries', keywords: ['bigbasket', 'supermarket', 'innovative retail'] },
  { name: 'Instamart', categoryId: 'cat-groceries', keywords: ['instamart'] },
  { name: 'DMart', categoryId: 'cat-groceries', keywords: ['dmart', 'd-mart', 'avenue supermarts'] },
  { name: 'Nature\'s Basket', categoryId: 'cat-groceries', keywords: ['nature\'s basket', 'godrej natures'] },

  // Transportation
  { name: 'Uber Rides', categoryId: 'cat-transport', keywords: ['uber', 'uber trip', 'uber bv', 'rasier'] },
  { name: 'Ola Cabs', categoryId: 'cat-transport', keywords: ['ola', 'ani technologies', 'olacabs'] },
  { name: 'Rapido', categoryId: 'cat-transport', keywords: ['rapido', 'roppen transportation'] },
  { name: 'Indian Oil', categoryId: 'cat-transport', keywords: ['indian oil', 'indianoil', 'petrol pump', 'ioc', 'fuel'] },
  { name: 'HPCL Fuel', categoryId: 'cat-transport', keywords: ['hpcl', 'hindustan petroleum', 'hp petrol'] },
  { name: 'BPCL Fuel', categoryId: 'cat-transport', keywords: ['bpcl', 'bharat petroleum'] },
  { name: 'Delhi Metro (DMRC)', categoryId: 'cat-transport', keywords: ['dmrc', 'delhi metro', 'metro rail'] },

  // Shopping
  { name: 'Amazon', categoryId: 'cat-shopping', keywords: ['amazon', 'amazon seller', 'amazon.in', 'amzn'] },
  { name: 'Flipkart', categoryId: 'cat-shopping', keywords: ['flipkart', 'fk internet'] },
  { name: 'Myntra', categoryId: 'cat-shopping', keywords: ['myntra', 'myntra designs'] },
  { name: 'Zara', categoryId: 'cat-shopping', keywords: ['zara', 'inditex'] },
  { name: 'H&M', categoryId: 'cat-shopping', keywords: ['h&m', 'hennes & mauritz'] },
  { name: 'IKEA', categoryId: 'cat-shopping', keywords: ['ikea', 'ikea india'] },

  // Entertainment
  { name: 'PVR INOX Cinemas', categoryId: 'cat-entertainment', keywords: ['pvr', 'inox', 'cinema', 'movie ticket', 'popcorn combo'] },
  { name: 'BookMyShow', categoryId: 'cat-entertainment', keywords: ['bookmyshow', 'bigtree entertainment'] },
  { name: 'Netflix', categoryId: 'cat-subscriptions', keywords: ['netflix', 'streaming subscription'] },
  { name: 'Spotify', categoryId: 'cat-subscriptions', keywords: ['spotify', 'spotify music'] },

  // Utilities
  { name: 'Jio Telecom', categoryId: 'cat-utilities', keywords: ['jio', 'reliance jio', 'jio recharge'] },
  { name: 'Airtel', categoryId: 'cat-utilities', keywords: ['airtel', 'bharti airtel'] },
  { name: 'Electricity Bill', categoryId: 'cat-utilities', keywords: ['electricity', 'bses', 'tatapower', 'bescom', 'mseb'] },
];

/**
 * Intelligent Receipt Text Extractor & Parser
 */
export function parseReceiptText(
  rawText: string,
  categories: Category[],
  baseCurrency: SupportedCurrency = 'INR'
): ReceiptScanResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullLower = rawText.toLowerCase();

  // 1. Identify Merchant
  let matchedMerchant = 'Retail Merchant';
  let matchedCategoryId = 'cat-food';
  let confidence = 0.6;

  for (const merchant of KNOWN_MERCHANTS) {
    const hasMatch = merchant.keywords.some((kw) => fullLower.includes(kw));
    if (hasMatch) {
      matchedMerchant = merchant.name;
      matchedCategoryId = merchant.categoryId;
      confidence = 0.9;
      break;
    }
  }

  // Fallback: If not matched in known merchants, pick first non-empty line as merchant name
  if (matchedMerchant === 'Retail Merchant' && lines.length > 0) {
    const candidateName = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    if (candidateName.length >= 3 && candidateName.length <= 35) {
      matchedMerchant = candidateName;
      confidence = 0.7;
    }
  }

  // 2. Extract Total Amount
  // Look for lines containing "Total", "Grand Total", "Amount Paid", "Net Amount", "Bill Total", "Balance"
  let extractedAmount = 0;
  const totalKeywords = ['grand total', 'net total', 'total amount', 'total paid', 'total', 'amount', 'balance due', 'inr', 'rs'];

  // Search from bottom upwards (totals are usually near bottom of receipts)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    const hasTotalKeyword = totalKeywords.some((kw) => line.includes(kw));

    if (hasTotalKeyword) {
      const numMatch = line.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
      if (numMatch && numMatch[1]) {
        const parsed = parseFloat(numMatch[1].replace(/,/g, ''));
        if (parsed > 0 && parsed < 1000000) {
          extractedAmount = parsed;
          break;
        }
      }
    }
  }

  // Fallback: Find highest number in the entire receipt if not found via keywords
  if (extractedAmount === 0) {
    const allNumbers = rawText.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/gi);
    if (allNumbers && allNumbers.length > 0) {
      const candidates = allNumbers
        .map((n) => parseFloat(n.replace(/[^0-9.]/g, '')))
        .filter((n) => !isNaN(n) && n > 0 && n < 100000);
      if (candidates.length > 0) {
        extractedAmount = Math.max(...candidates);
        confidence = Math.max(0.5, confidence - 0.1);
      }
    }
  }

  // 3. Extract Tax / GST
  let extractedTax: number | undefined;
  const taxKeywords = ['gst', 'cgst', 'sgst', 'tax', 'vat'];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (taxKeywords.some((kw) => lowerLine.includes(kw))) {
      const taxMatch = line.match(/(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (taxMatch && taxMatch[1]) {
        const val = parseFloat(taxMatch[1]);
        if (val > 0 && val < extractedAmount) {
          extractedTax = val;
          break;
        }
      }
    }
  }

  // 4. Extract Date
  let extractedDate = format(new Date(), 'yyyy-MM-dd');
  // Match formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YY
  const dateRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b|\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/;
  const dateMatch = rawText.match(dateRegex);

  if (dateMatch) {
    try {
      if (dateMatch[4]) {
        // YYYY-MM-DD format
        const y = parseInt(dateMatch[4]);
        const m = String(parseInt(dateMatch[5])).padStart(2, '0');
        const d = String(parseInt(dateMatch[6])).padStart(2, '0');
        extractedDate = `${y}-${m}-${d}`;
      } else if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
        // DD/MM/YYYY format
        const d = String(parseInt(dateMatch[1])).padStart(2, '0');
        const m = String(parseInt(dateMatch[2])).padStart(2, '0');
        let y = parseInt(dateMatch[3]);
        if (y < 100) y += 2000;
        extractedDate = `${y}-${m}-${d}`;
      }
    } catch {}
  }

  // Ensure category exists
  const existingCat = categories.find((c) => c.id === matchedCategoryId) || categories[0];
  const categoryId = existingCat ? existingCat.id : 'cat-food';
  const categoryName = existingCat ? existingCat.name : 'Food & Dining';

  return {
    merchant: matchedMerchant,
    amount: extractedAmount,
    date: extractedDate,
    tax: extractedTax,
    categoryId,
    categoryName,
    confidence,
    rawText,
  };
}

/**
 * Sample Demo Receipts for instant 1-click test demonstration
 */
export const DEMO_RECEIPTS: Array<{
  title: string;
  merchant: string;
  amount: number;
  date: string;
  categoryId: string;
  rawText: string;
}> = [
  {
    title: 'Starbucks Coffee Receipt',
    merchant: 'Starbucks Coffee',
    amount: 720,
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: 'cat-food',
    rawText: `STARBUCKS COFFEE INDIA
Store #4819 - Connaught Place
GSTIN: 07AABCS1429B1Z8

1x Iced Caramel Macchiato    ₹380.00
1x Java Chip Frappuccino     ₹340.00
----------------------------------------
Subtotal:                    ₹720.00
CGST @ 2.5%:                 ₹18.00
SGST @ 2.5%:                 ₹18.00
----------------------------------------
TOTAL AMOUNT:                ₹720.00
Payment Method: UPI / GPay
Date: ${format(new Date(), 'dd/MM/yyyy')} 14:32`,
  },
  {
    title: 'Blinkit Grocery Order',
    merchant: 'Blinkit Instant Groceries',
    amount: 1450,
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: 'cat-groceries',
    rawText: `BLINKIT COMMERCE PVT LTD
Order #BLK-89104812
Delivered in 8 minutes

1x Aashirvaad Whole Wheat Atta 5kg   ₹245.00
2x Amul Taaza Milk 1L               ₹132.00
1x Fortune Sunflower Oil 1L         ₹165.00
1x Fresh Alphonso Mangoes 1kg       ₹480.00
1x Nutella Hazelnut Spread 350g     ₹428.00
----------------------------------------
Total Items: 6
Delivery Fee: FREE
Handling Charge: ₹0.00
----------------------------------------
GRAND TOTAL:                        ₹1,450.00
Paid via PhonePe UPI
Date: ${format(new Date(), 'dd/MM/yyyy')} 09:15`,
  },
  {
    title: 'Uber Trip Receipt',
    merchant: 'Uber Rides',
    amount: 485,
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: 'cat-transport',
    rawText: `UBER B.V. TRIP RECEIPT
Ride Type: Uber Premier
Driver: Rajesh Kumar (DL 1Z 4820)

Trip Fare (14.2 km):         ₹410.00
Wait Time:                   ₹25.00
Tolls & Surcharges:          ₹50.00
----------------------------------------
TOTAL FARE:                  ₹485.00
Paid via Paytm Wallet
Date: ${format(new Date(), 'dd/MM/yyyy')} 19:45`,
  },
];
