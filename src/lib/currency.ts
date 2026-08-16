import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { SupportedCurrency } from '../types';

/**
 * Converts an amount from one currency to another using exchange rates.
 * Supports direct base rates and cross-currency triangular conversion.
 * 
 * @param amount - Numeric value in `from` currency
 * @param from - Origin currency code (e.g. 'USD', 'INR')
 * @param to - Target currency code (e.g. 'EUR', 'USD')
 * @param rates - Map of currency code to rate relative to the base
 * @returns Converted numeric amount
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (amount === 0 || !amount || isNaN(amount)) {
    return 0;
  }

  const normFrom = (from || 'INR').toUpperCase();
  const normTo = (to || 'INR').toUpperCase();

  // Same currency: no-op
  if (normFrom === normTo) {
    return amount;
  }

  // Missing or empty rates: fallback to original amount safely
  if (!rates || typeof rates !== 'object' || Object.keys(rates).length === 0) {
    return amount;
  }

  // Case 1: Base currency is `normFrom` (e.g. 1 USD = 0.92 EUR)
  if (rates[normTo] !== undefined && (rates[normFrom] === 1 || rates[normFrom] === undefined)) {
    const rate = rates[normTo];
    if (typeof rate === 'number' && !isNaN(rate) && rate > 0) {
      return amount * rate;
    }
  }

  // Case 2: Triangular cross-rate conversion (e.g. converting INR to EUR when rates are relative to USD)
  const fromRate = rates[normFrom];
  const toRate = rates[normTo];

  if (
    typeof fromRate === 'number' &&
    typeof toRate === 'number' &&
    fromRate > 0 &&
    toRate > 0
  ) {
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }

  // Case 3: Target rate exists directly
  if (typeof toRate === 'number' && toRate > 0) {
    return amount * toRate;
  }

  // Fallback safely to original amount
  return amount;
}

/**
 * Formats a converted amount with proper currency symbols and precision.
 */
export function formatConvertedCurrency(
  amount: number,
  from: string,
  to: SupportedCurrency,
  rates: Record<string, number>,
  showSign = false
): string {
  const converted = convertAmount(amount, from, to, rates);
  return formatCurrency(converted, to, showSign);
}

/**
 * Formats a converted amount in compact form (e.g. $1.5k, €2.4M).
 */
export function formatCompactConvertedCurrency(
  amount: number,
  from: string,
  to: SupportedCurrency,
  rates: Record<string, number>
): string {
  const converted = convertAmount(amount, from, to, rates);
  return formatCompactCurrency(converted, to);
}
