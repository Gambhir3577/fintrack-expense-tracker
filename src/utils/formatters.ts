import { format, parseISO, isValid } from 'date-fns';
import { CURRENCY_CONFIGS } from './constants';
import { SupportedCurrency } from '../types';

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'USD',
  showSign: boolean = false
): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;
  if (currency === 'JPY') {
    formattedNumber = Math.round(absAmount).toLocaleString('en-US');
  } else {
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  let result: string;
  if (config.symbol === 'CHF' || config.symbol === 'AED') {
    result = `${config.symbol} ${formattedNumber}`;
  } else {
    result = `${config.symbol}${formattedNumber}`;
  }

  if (isNegative) {
    return `-${result}`;
  }
  if (showSign && amount > 0) {
    return `+${result}`;
  }
  return result;
}

export function formatCompactCurrency(
  amount: number,
  currency: SupportedCurrency = 'USD'
): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const absAmount = Math.abs(amount);
  let formatted: string;

  if (absAmount >= 1_000_000) {
    formatted = `${(absAmount / 1_000_000).toFixed(1)}M`;
  } else if (absAmount >= 1_000) {
    formatted = `${(absAmount / 1_000).toFixed(1)}k`;
  } else {
    formatted = absAmount.toFixed(0);
  }

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${config.symbol}${formatted}`;
}

export function formatPercent(value: number, includeSign = false): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateString(dateStr: string, formatPattern = 'MMM dd, yyyy'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return dateStr;
    return format(d, formatPattern);
  } catch {
    return dateStr;
  }
}
