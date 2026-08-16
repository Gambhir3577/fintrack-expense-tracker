import Papa from 'papaparse';
import { parse, isValid, format } from 'date-fns';
import { Category, CSVColumnMapping, CSVParsedRow, Transaction, TransactionType } from '../types';
import { AUTO_CATEGORIZATION_KEYWORDS } from './constants';

export async function parseCSVFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, string>[]).filter((row) =>
          Object.values(row).some((val) => val !== null && val !== undefined && val.toString().trim() !== '')
        );
        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function detectColumnMapping(headers: string[]): CSVColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const mapping: CSVColumnMapping = {
    date: '',
    description: '',
    amount: '',
  };

  // Date column detection
  const dateKeywords = ['date', 'transaction_date', 'trans date', 'txn date', 'posting date', 'posted date', 'time'];
  for (const keyword of dateKeywords) {
    const idx = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
    if (idx !== -1) {
      mapping.date = headers[idx];
      break;
    }
  }

  // Description / Payee detection
  const descKeywords = ['description', 'payee', 'merchant', 'narrative', 'memo', 'details', 'name', 'particulars', 'reference'];
  for (const keyword of descKeywords) {
    const idx = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
    if (idx !== -1) {
      mapping.description = headers[idx];
      break;
    }
  }

  // Amount detection
  const amountKeywords = ['amount', 'net amount', 'total', 'debit', 'value', 'price', 'sum'];
  for (const keyword of amountKeywords) {
    const idx = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
    if (idx !== -1) {
      mapping.amount = headers[idx];
      break;
    }
  }

  // Optional Type detection
  const typeKeywords = ['type', 'transaction type', 'cr/dr', 'direction'];
  for (const keyword of typeKeywords) {
    const idx = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
    if (idx !== -1) {
      mapping.type = headers[idx];
      break;
    }
  }

  // Optional Category detection
  const catKeywords = ['category', 'group', 'tag'];
  for (const keyword of catKeywords) {
    const idx = lowerHeaders.findIndex((h) => h === keyword || h.includes(keyword));
    if (idx !== -1) {
      mapping.category = headers[idx];
      break;
    }
  }

  return mapping;
}

export function parseDateFlexible(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  // Try standard ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  const formats = [
    'MM/dd/yyyy',
    'M/d/yyyy',
    'dd/MM/yyyy',
    'd/M/yyyy',
    'yyyy/MM/dd',
    'yyyy.MM.dd',
    'dd-MM-yyyy',
    'MM-dd-yyyy',
    'yyyy-MM-dd HH:mm:ss',
    'MM/dd/yy',
    'dd/MM/yy',
    'MMM dd, yyyy',
    'dd MMM yyyy',
    'MMMM dd, yyyy',
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(cleaned, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch {
      // Continue to next format
    }
  }

  // Fallback try Date constructor
  try {
    const parsed = new Date(cleaned);
    if (isValid(parsed) && !isNaN(parsed.getTime()) && parsed.getFullYear() > 1990 && parsed.getFullYear() < 2100) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {
    // Ignore
  }

  return null;
}

export function suggestCategoryFromDescription(
  description: string,
  categories: Category[],
  fallbackCategoryId: string = 'cat-other-expense'
): string {
  if (!description) return fallbackCategoryId;
  const cleanDesc = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  // 1. Keyword rule match
  for (const [keyword, categoryId] of Object.entries(AUTO_CATEGORIZATION_KEYWORDS)) {
    const formattedKeyword = keyword.replace('_', ' ');
    if (cleanDesc.includes(formattedKeyword)) {
      const match = categories.find((c) => c.id === categoryId);
      if (match) return match.id;
    }
  }

  // 2. Direct category name match
  for (const category of categories) {
    const catNameLower = category.name.toLowerCase();
    if (cleanDesc.includes(catNameLower)) {
      return category.id;
    }
  }

  return fallbackCategoryId;
}

export function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function isDuplicateTransaction(
  target: { date: string; amount: number; description: string },
  existingList: Transaction[]
): boolean {
  const normTargetDesc = normalizeDescription(target.description);
  const targetAmountRounded = Math.round(Math.abs(target.amount) * 100);

  return existingList.some((existing) => {
    if (existing.date !== target.date) return false;
    const existingAmountRounded = Math.round(Math.abs(existing.amount) * 100);
    if (existingAmountRounded !== targetAmountRounded) return false;
    const normExistingDesc = normalizeDescription(existing.description);
    return normExistingDesc === normTargetDesc || normExistingDesc.includes(normTargetDesc) || normTargetDesc.includes(normExistingDesc);
  });
}

export function processParsedRows(
  rows: Record<string, string>[],
  mapping: CSVColumnMapping,
  categories: Category[],
  existingTransactions: Transaction[]
): CSVParsedRow[] {
  return rows.map((rawRow, idx) => {
    const rawDate = rawRow[mapping.date] || '';
    const rawDesc = rawRow[mapping.description] || '';
    const rawAmount = rawRow[mapping.amount] || '0';
    const rawType = mapping.type ? rawRow[mapping.type] : '';
    const rawCategory = mapping.category ? rawRow[mapping.category] : '';

    const parsedDate = parseDateFlexible(rawDate);
    const cleanedAmountStr = rawAmount.toString().replace(/[$,€£₹\s]/g, '').trim();
    const parsedAmountNum = parseFloat(cleanedAmountStr);

    let type: TransactionType = 'expense';
    let absoluteAmount = Math.abs(parsedAmountNum || 0);

    // Determine type:
    // If rawAmount is negative or rawType indicates expense, or rawAmount positive and type is credit
    if (rawType) {
      const lowerType = rawType.toLowerCase();
      if (lowerType.includes('credit') || lowerType.includes('income') || lowerType.includes('deposit')) {
        type = 'income';
      } else {
        type = 'expense';
      }
    } else {
      if (parsedAmountNum < 0) {
        type = 'expense'; // Many bank exports have negative numbers for debits/expenses
      } else if (
        rawDesc.toLowerCase().includes('salary') ||
        rawDesc.toLowerCase().includes('payroll') ||
        rawDesc.toLowerCase().includes('deposit') ||
        rawDesc.toLowerCase().includes('interest')
      ) {
        type = 'income';
      } else {
        type = 'expense';
      }
    }

    let categoryId = 'cat-other-expense';
    if (rawCategory) {
      const matchedCat = categories.find((c) => c.name.toLowerCase() === rawCategory.toLowerCase());
      if (matchedCat) {
        categoryId = matchedCat.id;
      } else {
        categoryId = suggestCategoryFromDescription(rawDesc, categories, type === 'income' ? 'cat-other-income' : 'cat-other-expense');
      }
    } else {
      categoryId = suggestCategoryFromDescription(rawDesc, categories, type === 'income' ? 'cat-other-income' : 'cat-other-expense');
    }

    let isValid = true;
    let validationError = '';

    if (!parsedDate) {
      isValid = false;
      validationError = `Invalid date format: "${rawDate}"`;
    } else if (isNaN(parsedAmountNum) || absoluteAmount <= 0) {
      isValid = false;
      validationError = `Invalid amount: "${rawAmount}"`;
    } else if (!rawDesc.trim()) {
      isValid = false;
      validationError = 'Missing description';
    }

    const isDuplicate = isValid && isDuplicateTransaction(
      { date: parsedDate!, amount: absoluteAmount, description: rawDesc },
      existingTransactions
    );

    return {
      id: `row-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      raw: rawRow,
      mapped: {
        date: parsedDate || format(new Date(), 'yyyy-MM-dd'),
        description: rawDesc.trim() || 'Untitled Transaction',
        amount: absoluteAmount,
        type,
        categoryId,
      },
      isDuplicate,
      isValid,
      validationError: validationError || undefined,
      includeInImport: isValid && !isDuplicate,
    };
  });
}
