export type TransactionType = 'income' | 'expense';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  id: string;
  frequency: RecurrenceFrequency;
  startDate: string; // ISO string 'YYYY-MM-DD'
  endDate?: string;
  lastGeneratedDate?: string;
  isActive: boolean;
  template: {
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string 'YYYY-MM-DD'
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  isRecurring: boolean;
  recurringRuleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name, e.g. 'Utensils', 'Car', 'Home'
  color: string; // Hex color code
  type: TransactionType | 'both';
  budgetLimit?: number; // Monthly budget limit in active currency
  isDefault?: boolean;
}

export interface BudgetGoal {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  period: string; // 'YYYY-MM'
  notifyThreshold?: number; // e.g. 0.8 for 80%
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'SGD' | 'AED';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  rateToUSD: number; // For optional multi-currency conversion
  format: string;
}

export interface UserSettings {
  currency: SupportedCurrency;
  theme: 'dark' | 'light' | 'system';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  hasCompletedOnboarding: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface CSVColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
  notes?: string;
}

export interface CSVParsedRow {
  id: string;
  raw: Record<string, string>;
  mapped: {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    notes?: string;
  };
  isDuplicate: boolean;
  isValid: boolean;
  validationError?: string;
  includeInImport: boolean;
}

export interface CategorySpendingSummary {
  category: Category;
  spent: number;
  budgetLimit: number;
  percentageUsed: number;
  remaining: number;
  isOverBudget: boolean;
  isNearLimit: boolean; // >= 80%
  transactionCount: number;
}
