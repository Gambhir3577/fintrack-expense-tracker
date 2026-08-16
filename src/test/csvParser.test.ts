import { describe, it, expect } from 'vitest';
import {
  detectColumnMapping,
  parseDateFlexible,
  suggestCategoryFromDescription,
  isDuplicateTransaction,
  processParsedRows,
} from '../utils/csvParser';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import { Transaction } from '../types';

describe('CSV Parser & Categorizer', () => {
  it('should auto-detect standard CSV column headers', () => {
    const headers = ['Transaction Date', 'Payee / Merchant', 'Amount', 'Type'];
    const mapping = detectColumnMapping(headers);

    expect(mapping.date).toBe('Transaction Date');
    expect(mapping.description).toBe('Payee / Merchant');
    expect(mapping.amount).toBe('Amount');
    expect(mapping.type).toBe('Type');
  });

  it('should parse flexible date formats correctly to YYYY-MM-DD', () => {
    expect(parseDateFlexible('2026-08-16')).toBe('2026-08-16');
    expect(parseDateFlexible('08/16/2026')).toBe('2026-08-16');
    expect(parseDateFlexible('16/08/2026')).toBe('2026-08-16');
    expect(parseDateFlexible('2026/08/16')).toBe('2026-08-16');
    expect(parseDateFlexible('Aug 16, 2026')).toBe('2026-08-16');
    expect(parseDateFlexible('invalid-date')).toBeNull();
  });

  it('should intelligently categorize merchant descriptions', () => {
    expect(suggestCategoryFromDescription('Uber Trip to Airport', DEFAULT_CATEGORIES)).toBe('cat-transport');
    expect(suggestCategoryFromDescription('Whole Foods Market Groceries', DEFAULT_CATEGORIES)).toBe('cat-groceries');
    expect(suggestCategoryFromDescription('Starbucks Reserve Coffee', DEFAULT_CATEGORIES)).toBe('cat-food');
    expect(suggestCategoryFromDescription('Netflix Monthly Subscription', DEFAULT_CATEGORIES)).toBe('cat-subscriptions');
    expect(suggestCategoryFromDescription('TechCorp Payroll Deposit', DEFAULT_CATEGORIES)).toBe('cat-salary');
    expect(suggestCategoryFromDescription('Unknown Random Vendor X100', DEFAULT_CATEGORIES)).toBe('cat-other-expense');
  });

  it('should detect duplicate transactions with matching date, amount and description', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-1',
        date: '2026-08-15',
        description: 'Starbucks Coffee',
        amount: 6.50,
        type: 'expense',
        categoryId: 'cat-food',
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    expect(
      isDuplicateTransaction(
        { date: '2026-08-15', amount: 6.50, description: 'Starbucks Coffee' },
        existing
      )
    ).toBe(true);

    expect(
      isDuplicateTransaction(
        { date: '2026-08-15', amount: 8.00, description: 'Starbucks Coffee' },
        existing
      )
    ).toBe(false);

    expect(
      isDuplicateTransaction(
        { date: '2026-08-16', amount: 6.50, description: 'Starbucks Coffee' },
        existing
      )
    ).toBe(false);
  });

  it('should process raw CSV rows into structured transactions with validation', () => {
    const rawRows = [
      { Date: '2026-08-10', Memo: 'Whole Foods Market', Total: '124.50' },
      { Date: 'invalid-date', Memo: 'Bad Row', Total: '50.00' },
    ];

    const mapping = {
      date: 'Date',
      description: 'Memo',
      amount: 'Total',
    };

    const results = processParsedRows(rawRows, mapping, DEFAULT_CATEGORIES, []);

    expect(results).toHaveLength(2);
    expect(results[0].isValid).toBe(true);
    expect(results[0].mapped.amount).toBe(124.5);
    expect(results[0].mapped.categoryId).toBe('cat-groceries');
    expect(results[0].includeInImport).toBe(true);

    expect(results[1].isValid).toBe(false);
    expect(results[1].includeInImport).toBe(false);
  });
});
