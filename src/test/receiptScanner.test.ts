import { describe, it, expect } from 'vitest';
import { parseReceiptText } from '../lib/receiptScanner';
import { Category } from '../types';

const mockCategories: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', type: 'expense', isDefault: true },
];

describe('Receipt Scanner OCR Engine', () => {
  it('identifies Starbucks merchant, total amount, and categorizes as Food', () => {
    const rawReceipt = `STARBUCKS COFFEE INDIA
Store #104 - Mumbai
Date: 15/08/2026

1x Caramel Frappuccino  ₹340.00
1x Blueberry Muffin     ₹220.00
-------------------------------
TOTAL AMOUNT:           ₹560.00`;

    const result = parseReceiptText(rawReceipt, mockCategories, 'INR');

    expect(result.merchant).toBe('Starbucks Coffee');
    expect(result.amount).toBe(560);
    expect(result.categoryId).toBe('cat-food');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('identifies Blinkit order, total, and categorizes as Groceries', () => {
    const rawReceipt = `BLINKIT COMMERCE
Order #BLK-99210
Items: 4
-------------------------------
GRAND TOTAL: ₹1,240.00
Paid Online`;

    const result = parseReceiptText(rawReceipt, mockCategories, 'INR');

    expect(result.merchant).toBe('Blinkit');
    expect(result.amount).toBe(1240);
    expect(result.categoryId).toBe('cat-groceries');
  });

  it('identifies Uber ride receipt and categorizes as Transportation', () => {
    const rawReceipt = `UBER TRIP RECEIPT
Date: 2026-08-14
Total Fare: ₹380.00`;

    const result = parseReceiptText(rawReceipt, mockCategories, 'INR');

    expect(result.merchant).toBe('Uber Rides');
    expect(result.amount).toBe(380);
    expect(result.categoryId).toBe('cat-transport');
  });
});
