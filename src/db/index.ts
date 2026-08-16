import Dexie, { Table } from 'dexie';
import { Transaction, Category, BudgetGoal, RecurrenceRule, UserSettings } from '../types';
import { DEFAULT_CATEGORIES } from '../utils/constants';

export interface CachedExchangeRates {
  baseCurrency: string;
  rates: Record<string, number>;
  timestamp: number; // Date.now()
  source: string;
}

export class FinTrackDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  budgets!: Table<BudgetGoal, string>;
  recurringRules!: Table<RecurrenceRule, string>;
  settings!: Table<UserSettings & { id: string }, string>;
  exchangeRates!: Table<CachedExchangeRates, string>;

  constructor() {
    super('FinTrackDB');
    this.version(1).stores({
      transactions: 'id, date, type, categoryId, isRecurring, recurringRuleId, createdAt',
      categories: 'id, name, type, isDefault',
      budgets: 'id, categoryId, period',
      recurringRules: 'id, frequency, isActive, startDate',
      settings: 'id',
      exchangeRates: 'baseCurrency, timestamp',
    });
  }
}

export const db = new FinTrackDatabase();

export async function initializeDatabase(): Promise<void> {
  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }

  const existingSettings = await db.settings.get('app-settings');
  if (!existingSettings) {
    await db.settings.put({
      id: 'app-settings',
      currency: 'INR',
      theme: 'dark',
      dateFormat: 'YYYY-MM-DD',
      firstDayOfWeek: 1,
      hasCompletedOnboarding: false,
    });
  }
}
