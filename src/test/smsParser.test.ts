import { describe, it, expect } from 'vitest';
import { parseSingleSms, parseSmsBatch } from '../utils/smsParser';

describe('On-Device SMS Transaction Parser', () => {
  it('correctly parses HDFC bank debit to Swiggy', () => {
    const raw = {
      id: '1',
      sender: 'VM-HDFCBK',
      body: 'Dear Customer, INR 450.00 debited from A/C ending 1234 on 15-AUG-26 to Swiggy. Avl Bal: INR 12,450.00.',
      date: 1786780000000,
    };

    const parsed = parseSingleSms(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(450);
    expect(parsed?.type).toBe('expense');
    expect(parsed?.accountDigits).toBe('1234');
    expect(parsed?.merchant.toLowerCase()).toContain('swiggy');
    expect(parsed?.categoryName).toBe('Food & Dining');
  });

  it('correctly parses SBI UPI debit to Uber', () => {
    const raw = {
      id: '2',
      sender: 'SBIUPI',
      body: 'Your a/c no. XX9876 is debited by Rs. 850.50 on 12Aug26 towards Uber India ref no 234123.',
      date: 1786780000000,
    };

    const parsed = parseSingleSms(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(850.5);
    expect(parsed?.type).toBe('expense');
    expect(parsed?.accountDigits).toBe('9876');
    expect(parsed?.merchant.toLowerCase()).toContain('uber');
    expect(parsed?.categoryName).toBe('Transportation');
  });

  it('correctly parses Salary Credit', () => {
    const raw = {
      id: '3',
      sender: 'ICICIB',
      body: 'Your Acct XX4321 is credited with INR 75,000.00 on 01-Aug-26 by Salary. Available Balance is INR 98,230.',
      date: 1786780000000,
    };

    const parsed = parseSingleSms(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(75000);
    expect(parsed?.type).toBe('income');
    expect(parsed?.categoryName).toBe('Income');
  });

  it('rejects OTP security messages', () => {
    const raw = {
      id: '4',
      sender: 'AMAZON',
      body: '492019 is your OTP for transaction of Rs. 500 at Amazon. Do not share with anyone.',
      date: 1786780000000,
    };

    const parsed = parseSingleSms(raw);
    expect(parsed).toBeNull();
  });

  it('rejects marketing and loan offers', () => {
    const raw = {
      id: '5',
      sender: 'AXISBK',
      body: 'Congratulations! Pre-approved personal loan of Rs. 5,00,000 is ready for you. Apply now!',
      date: 1786780000000,
    };

    const parsed = parseSingleSms(raw);
    expect(parsed).toBeNull();
  });
});
