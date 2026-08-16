import { create } from 'zustand';
import { SupportedCurrency } from '../types';
import { fetchExchangeRates, CACHE_TTL_MS } from '../lib/currencyService';
import { convertAmount } from '../lib/currency';
import { useSettingsStore } from './useSettingsStore';

interface CurrencyState {
  baseCurrency: SupportedCurrency;
  storedCurrency: SupportedCurrency;
  rates: Record<string, number>;
  lastUpdated: string | null;
  timestamp: number | null;
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
  source: string;

  // Actions
  setBaseCurrency: (currency: SupportedCurrency) => Promise<void>;
  refreshRates: (force?: boolean) => Promise<void>;
  initCurrency: (initialBase?: SupportedCurrency) => Promise<void>;
  convert: (amount: number, from?: string) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  baseCurrency: 'INR',
  storedCurrency: 'INR', // Default currency in which transactions are recorded
  rates: {},
  lastUpdated: null,
  timestamp: null,
  isLoading: false,
  error: null,
  isFallback: false,
  source: '',

  initCurrency: async (initialBase) => {
    const settingsCurrency = initialBase || useSettingsStore.getState().settings.currency || 'INR';
    set({ baseCurrency: settingsCurrency, isLoading: true });

    try {
      const result = await fetchExchangeRates(settingsCurrency, false);
      set({
        rates: result.rates,
        timestamp: result.timestamp,
        lastUpdated: new Date(result.timestamp).toISOString(),
        isFallback: result.isFallback,
        source: result.source,
        error: result.error || null,
        isLoading: false,
      });

      if (result.error) {
        useSettingsStore.getState().showToast(result.error, 'warning');
      }
    } catch (err: any) {
      console.error('Error hydrating currency rates:', err);
      set({
        isLoading: false,
        error: 'Failed to fetch live exchange rates',
        isFallback: true,
      });
    }
  },

  setBaseCurrency: async (currency: SupportedCurrency) => {
    const currentBase = get().baseCurrency;
    if (currentBase === currency && Object.keys(get().rates).length > 0) {
      return;
    }

    set({ baseCurrency: currency, isLoading: true });
    // Also sync to global user settings
    await useSettingsStore.getState().setCurrency(currency);

    try {
      const result = await fetchExchangeRates(currency, false);
      set({
        rates: result.rates,
        timestamp: result.timestamp,
        lastUpdated: new Date(result.timestamp).toISOString(),
        isFallback: result.isFallback,
        source: result.source,
        error: result.error || null,
        isLoading: false,
      });

      if (result.error) {
        useSettingsStore.getState().showToast(result.error, 'warning');
      }
    } catch (err: any) {
      console.error('Failed to set base currency rates:', err);
      set({
        isLoading: false,
        error: 'Unable to update exchange rates',
        isFallback: true,
      });
    }
  },

  refreshRates: async (force = true) => {
    const currentBase = get().baseCurrency;
    set({ isLoading: true, error: null });

    try {
      const result = await fetchExchangeRates(currentBase, force);
      set({
        rates: result.rates,
        timestamp: result.timestamp,
        lastUpdated: new Date(result.timestamp).toISOString(),
        isFallback: result.isFallback,
        source: result.source,
        error: result.error || null,
        isLoading: false,
      });

      if (result.isFallback) {
        useSettingsStore
          .getState()
          .showToast(
            result.error || `Using cached exchange rates from ${new Date(result.timestamp).toLocaleTimeString()}`,
            'info'
          );
      } else {
        useSettingsStore.getState().showToast(`Exchange rates updated for ${currentBase} (${result.source})`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to refresh rates:', err);
      set({
        isLoading: false,
        error: 'Failed to fetch latest exchange rates',
        isFallback: true,
      });
      useSettingsStore.getState().showToast('Failed to refresh exchange rates', 'error');
    }
  },

  convert: (amount: number, from?: string) => {
    const fromCurrency = from || get().storedCurrency;
    const toCurrency = get().baseCurrency;
    const rates = get().rates;
    return convertAmount(amount, fromCurrency, toCurrency, rates);
  },
}));
