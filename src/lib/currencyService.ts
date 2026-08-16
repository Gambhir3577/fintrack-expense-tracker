import { db, CachedExchangeRates } from '../db';
import { CURRENCY_CONFIGS } from '../utils/constants';
import { SupportedCurrency } from '../types';

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface ExchangeRatesResult {
  baseCurrency: string;
  rates: Record<string, number>;
  timestamp: number;
  isFallback: boolean;
  source: string;
  error?: string;
}

// Memory guard for rate limits / backoff per session
let lastRateLimitTime = 0;
const RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes backoff if rate-limited

export async function fetchExchangeRates(
  baseCurrency: string,
  forceRefresh = false
): Promise<ExchangeRatesResult> {
  const normBase = baseCurrency.toUpperCase();

  // 1. Check Dexie IndexedDB cache first
  try {
    const cached = await db.exchangeRates.get(normBase);
    if (cached) {
      const isFresh = Date.now() - cached.timestamp < CACHE_TTL_MS;
      if (isFresh && !forceRefresh) {
        return {
          baseCurrency: normBase,
          rates: cached.rates,
          timestamp: cached.timestamp,
          isFallback: false,
          source: cached.source || 'indexeddb-cache',
        };
      }
    }
  } catch (err) {
    console.warn('Could not read exchange rates from cache:', err);
  }

  // Check rate limit backoff
  const isBackingOff = Date.now() - lastRateLimitTime < RATE_LIMIT_BACKOFF_MS;

  let freshRates: Record<string, number> | null = null;
  let source = '';

  if (!isBackingOff) {
    // 2. Try primary API (ExchangeRate-API v6 if key exists)
    const apiKey = import.meta.env.VITE_EXCHANGE_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${normBase}`);
        if (res.ok) {
          const data = await res.json();
          if (data.result === 'success' && data.conversion_rates) {
            freshRates = data.conversion_rates;
            source = 'ExchangeRate-API (v6 Pro)';
          }
        } else if (res.status === 429) {
          lastRateLimitTime = Date.now();
        }
      } catch (e) {
        console.warn('ExchangeRate-API key fetch failed, trying fallbacks:', e);
      }
    }

    // 3. Fallback: Open ExchangeRate API (Free, no key needed)
    if (!freshRates) {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${normBase}`);
        if (res.ok) {
          const data = await res.json();
          if (data.result === 'success' && data.rates) {
            freshRates = data.rates;
            source = 'Open ExchangeRate API';
          }
        }
      } catch (e) {
        console.warn('Open ExchangeRate API fetch failed, trying Frankfurter:', e);
      }
    }

    // 4. Fallback: Frankfurter.app (European Central Bank data)
    if (!freshRates) {
      try {
        const res = await fetch(`https://api.frankfurter.app/latest?from=${normBase}`);
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            freshRates = { ...data.rates, [normBase]: 1.0 };
            source = 'Frankfurter ECB';
          }
        }
      } catch (e) {
        console.warn('Frankfurter API fetch failed:', e);
      }
    }
  }

  // 5. If we got live rates, save to Dexie and return
  if (freshRates) {
    const timestamp = Date.now();
    try {
      await db.exchangeRates.put({
        baseCurrency: normBase,
        rates: freshRates,
        timestamp,
        source,
      });
    } catch (err) {
      console.warn('Failed to cache exchange rates in Dexie:', err);
    }

    return {
      baseCurrency: normBase,
      rates: freshRates,
      timestamp,
      isFallback: false,
      source,
    };
  }

  // 6. Handle failure gracefully: Fall back to last cached rates in Dexie
  try {
    const cached = await db.exchangeRates.get(normBase);
    if (cached) {
      return {
        baseCurrency: normBase,
        rates: cached.rates,
        timestamp: cached.timestamp,
        isFallback: true,
        source: cached.source || 'stale-cache',
        error: 'Network unavailable. Using cached exchange rates.',
      };
    }
  } catch (e) {
    console.warn('Error fetching stale cache:', e);
  }

  // 7. Last resort: Build fallback rates from static CURRENCY_CONFIGS
  const staticRates: Record<string, number> = {};
  const baseRateToUSD = CURRENCY_CONFIGS[normBase as SupportedCurrency]?.rateToUSD || 1.0;
  
  Object.entries(CURRENCY_CONFIGS).forEach(([code, cfg]) => {
    // 1 base = (cfg.rateToUSD / baseRateToUSD)
    staticRates[code] = cfg.rateToUSD / baseRateToUSD;
  });

  return {
    baseCurrency: normBase,
    rates: staticRates,
    timestamp: Date.now(),
    isFallback: true,
    source: 'Default Static Fallback',
    error: 'Exchange rates unavailable. Showing approximate fallback rates.',
  };
}
