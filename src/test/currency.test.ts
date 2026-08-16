import { describe, it, expect } from 'vitest';
import { convertAmount } from '../lib/currency';

describe('Currency Conversion Engine (convertAmount)', () => {
  const sampleUSDRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.5,
    JPY: 155.0,
  };

  it('handles same currency conversion as a no-op', () => {
    expect(convertAmount(100, 'USD', 'USD', sampleUSDRates)).toBe(100);
    expect(convertAmount(5400.5, 'INR', 'INR', sampleUSDRates)).toBe(5400.5);
    expect(convertAmount(0, 'EUR', 'EUR', sampleUSDRates)).toBe(0);
  });

  it('performs direct valid conversion accurately from base currency', () => {
    // 100 USD to EUR (rate 0.92) = 92 EUR
    expect(convertAmount(100, 'USD', 'EUR', sampleUSDRates)).toBeCloseTo(92, 2);
    // 100 USD to INR (rate 83.5) = 8350 INR
    expect(convertAmount(100, 'USD', 'INR', sampleUSDRates)).toBeCloseTo(8350, 2);
    // 50 USD to JPY (rate 155.0) = 7750 JPY
    expect(convertAmount(50, 'USD', 'JPY', sampleUSDRates)).toBeCloseTo(7750, 2);
  });

  it('performs cross-currency triangular conversion accurately', () => {
    // 8350 INR to EUR via USD base:
    // (8350 / 83.5) * 0.92 = 100 * 0.92 = 92 EUR
    expect(convertAmount(8350, 'INR', 'EUR', sampleUSDRates)).toBeCloseTo(92, 2);

    // 92 EUR to GBP via USD base:
    // (92 / 0.92) * 0.79 = 100 * 0.79 = 79 GBP
    expect(convertAmount(92, 'EUR', 'GBP', sampleUSDRates)).toBeCloseTo(79, 2);
  });

  it('falls back safely to original amount when rates are missing, empty, or invalid', () => {
    // Empty rates
    expect(convertAmount(250, 'USD', 'EUR', {})).toBe(250);

    // Missing target rate
    expect(convertAmount(250, 'USD', 'XYZ', sampleUSDRates)).toBe(250);

    // Null/undefined rates object
    expect(convertAmount(300, 'USD', 'EUR', null as any)).toBe(300);
    expect(convertAmount(300, 'USD', 'EUR', undefined as any)).toBe(300);
  });

  it('handles zero and edge-case values safely', () => {
    expect(convertAmount(0, 'USD', 'EUR', sampleUSDRates)).toBe(0);
    expect(convertAmount(NaN, 'USD', 'EUR', sampleUSDRates)).toBe(0);
  });
});
