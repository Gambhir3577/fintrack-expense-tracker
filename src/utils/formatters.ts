import { format, parseISO, isValid } from 'date-fns';
import { CURRENCY_CONFIGS } from './constants';
import { SupportedCurrency } from '../types';

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'INR',
  showSign: boolean = false
): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;
  if (currency === 'JPY') {
    formattedNumber = Math.round(absAmount).toLocaleString('en-US');
  } else if (currency === 'INR') {
    formattedNumber = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
  currency: SupportedCurrency = 'INR'
): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
  const absAmount = Math.abs(amount);
  let formatted: string;

  if (currency === 'INR') {
    if (absAmount >= 10_000_000) {
      formatted = `${(absAmount / 10_000_000).toFixed(1)}Cr`;
    } else if (absAmount >= 100_000) {
      formatted = `${(absAmount / 100_000).toFixed(1)}L`;
    } else if (absAmount >= 1_000) {
      formatted = `${(absAmount / 1_000).toFixed(1)}k`;
    } else {
      formatted = absAmount.toFixed(0);
    }
  } else {
    if (absAmount >= 1_000_000) {
      formatted = `${(absAmount / 1_000_000).toFixed(1)}M`;
    } else if (absAmount >= 1_000) {
      formatted = `${(absAmount / 1_000).toFixed(1)}k`;
    } else {
      formatted = absAmount.toFixed(0);
    }
  }

  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${config.symbol}${formatted}`;
}

export function formatPercent(value: number, includeSign = false): string {
  const formatted = `${value.toFixed(1)}%`;
  if (includeSign && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatDateString(
  dateStr: string,
  pattern: string = 'yyyy-MM-dd'
): string {
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return dateStr;
    return format(parsed, pattern);
  } catch {
    return dateStr;
  }
}
