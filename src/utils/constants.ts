import { Category, CurrencyConfig, SupportedCurrency } from '../types';

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0, format: '$#,##0.00' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92, format: '€#,##0.00' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 0.79, format: '£#,##0.00' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 83.5, format: '₹#,##0.00' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 1.36, format: 'CA$#,##0.00' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 1.52, format: 'A$#,##0.00' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 155.0, format: '¥#,##0' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rateToUSD: 0.90, format: 'CHF #,##0.00' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateToUSD: 1.35, format: 'S$#,##0.00' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rateToUSD: 3.67, format: 'AED #,##0.00' },
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  {
    id: 'cat-salary',
    name: 'Salary & Wages',
    icon: 'Briefcase',
    color: '#10B981', // Emerald
    type: 'income',
    isDefault: true,
  },
  {
    id: 'cat-freelance',
    name: 'Freelance & Consulting',
    icon: 'Laptop',
    color: '#06B6D4', // Cyan
    type: 'income',
    isDefault: true,
  },
  {
    id: 'cat-investments',
    name: 'Investments & Dividends',
    icon: 'TrendingUp',
    color: '#8B5CF6', // Purple
    type: 'income',
    isDefault: true,
  },
  {
    id: 'cat-other-income',
    name: 'Other Income',
    icon: 'PlusCircle',
    color: '#3B82F6', // Blue
    type: 'income',
    isDefault: true,
  },

  // Expense Categories
  {
    id: 'cat-housing',
    name: 'Housing & Rent',
    icon: 'Home',
    color: '#F97316', // Orange
    type: 'expense',
    budgetLimit: 1600,
    isDefault: true,
  },
  {
    id: 'cat-food',
    name: 'Food & Dining',
    icon: 'Utensils',
    color: '#EF4444', // Red
    type: 'expense',
    budgetLimit: 600,
    isDefault: true,
  },
  {
    id: 'cat-groceries',
    name: 'Groceries & Markets',
    icon: 'ShoppingCart',
    color: '#14B8A6', // Teal
    type: 'expense',
    budgetLimit: 450,
    isDefault: true,
  },
  {
    id: 'cat-transport',
    name: 'Transportation & Fuel',
    icon: 'Car',
    color: '#6366F1', // Indigo
    type: 'expense',
    budgetLimit: 300,
    isDefault: true,
  },
  {
    id: 'cat-utilities',
    name: 'Bills & Utilities',
    icon: 'Zap',
    color: '#EAB308', // Yellow
    type: 'expense',
    budgetLimit: 250,
    isDefault: true,
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment & Leisure',
    icon: 'Film',
    color: '#EC4899', // Pink
    type: 'expense',
    budgetLimit: 200,
    isDefault: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping & Electronics',
    icon: 'ShoppingBag',
    color: '#A855F7', // Purple
    type: 'expense',
    budgetLimit: 350,
    isDefault: true,
  },
  {
    id: 'cat-health',
    name: 'Health & Wellness',
    icon: 'HeartPulse',
    color: '#06B6D4', // Cyan
    type: 'expense',
    budgetLimit: 180,
    isDefault: true,
  },
  {
    id: 'cat-education',
    name: 'Education & Learning',
    icon: 'GraduationCap',
    color: '#3B82F6', // Blue
    type: 'expense',
    budgetLimit: 120,
    isDefault: true,
  },
  {
    id: 'cat-travel',
    name: 'Travel & Vacations',
    icon: 'Plane',
    color: '#F43F5E', // Rose
    type: 'expense',
    budgetLimit: 400,
    isDefault: true,
  },
  {
    id: 'cat-subscriptions',
    name: 'Subscriptions & Services',
    icon: 'RefreshCw',
    color: '#64748B', // Slate
    type: 'expense',
    budgetLimit: 80,
    isDefault: true,
  },
  {
    id: 'cat-other-expense',
    name: 'General & Miscellaneous',
    icon: 'Tag',
    color: '#94A3B8', // Light slate
    type: 'expense',
    budgetLimit: 150,
    isDefault: true,
  },
];

export const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'Home', 'ShoppingCart', 'ShoppingBag', 'Film', 'Zap',
  'HeartPulse', 'GraduationCap', 'Plane', 'RefreshCw', 'Briefcase', 'Laptop',
  'TrendingUp', 'PlusCircle', 'Tag', 'Coffee', 'Gift', 'Shield', 'Smartphone',
  'Wifi', 'BookOpen', 'Music', 'Smile', 'Tv', 'Dumbbell', 'Scissors', 'Wrench',
  'CreditCard', 'PiggyBank', 'DollarSign', 'Fuel', 'Truck', 'Smile', 'Activity'
];

export const PALETTE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#78716C', // Stone
];

export const AUTO_CATEGORIZATION_KEYWORDS: Record<string, string> = {
  // Food & Dining
  uber_eats: 'cat-food',
  doordash: 'cat-food',
  grubhub: 'cat-food',
  starbucks: 'cat-food',
  mcdonald: 'cat-food',
  chipotle: 'cat-food',
  restaurant: 'cat-food',
  cafe: 'cat-food',
  bakery: 'cat-food',
  pizza: 'cat-food',
  diner: 'cat-food',
  burger: 'cat-food',
  taco: 'cat-food',
  coffee: 'cat-food',
  subway: 'cat-food',

  // Groceries
  walmart: 'cat-groceries',
  target: 'cat-groceries',
  costco: 'cat-groceries',
  trader_joe: 'cat-groceries',
  whole_foods: 'cat-groceries',
  kroger: 'cat-groceries',
  safeway: 'cat-groceries',
  aldi: 'cat-groceries',
  supermarket: 'cat-groceries',
  grocery: 'cat-groceries',
  market: 'cat-groceries',

  // Transport
  uber: 'cat-transport',
  lyft: 'cat-transport',
  shell: 'cat-transport',
  chevron: 'cat-transport',
  bp: 'cat-transport',
  gas: 'cat-transport',
  fuel: 'cat-transport',
  transit: 'cat-transport',
  metro: 'cat-transport',
  parking: 'cat-transport',
  toll: 'cat-transport',

  // Housing & Bills
  rent: 'cat-housing',
  landlord: 'cat-housing',
  mortgage: 'cat-housing',
  apartment: 'cat-housing',
  'pge': 'cat-utilities',
  'pg&e': 'cat-utilities',
  electric: 'cat-utilities',
  water: 'cat-utilities',
  energy: 'cat-utilities',
  att: 'cat-utilities',
  verizon: 'cat-utilities',
  tmobile: 'cat-utilities',
  internet: 'cat-utilities',
  comcast: 'cat-utilities',

  // Subscriptions & Entertainment
  netflix: 'cat-subscriptions',
  spotify: 'cat-subscriptions',
  apple: 'cat-subscriptions',
  youtube: 'cat-subscriptions',
  hulu: 'cat-subscriptions',
  disney: 'cat-subscriptions',
  hbo: 'cat-subscriptions',
  amazon_prime: 'cat-subscriptions',
  gym: 'cat-health',
  fitness: 'cat-health',
  pharmacy: 'cat-health',
  cvs: 'cat-health',
  walgreens: 'cat-health',
  doctor: 'cat-health',
  hospital: 'cat-health',
  dental: 'cat-health',

  // Shopping
  amazon: 'cat-shopping',
  ebay: 'cat-shopping',
  best_buy: 'cat-shopping',
  ikea: 'cat-shopping',
  clothing: 'cat-shopping',
  zara: 'cat-shopping',
  nike: 'cat-shopping',

  // Travel
  airbnb: 'cat-travel',
  delta: 'cat-travel',
  united: 'cat-travel',
  american_air: 'cat-travel',
  hotel: 'cat-travel',
  flight: 'cat-travel',
  expedia: 'cat-travel',
  booking: 'cat-travel',

  // Income
  payroll: 'cat-salary',
  salary: 'cat-salary',
  employer: 'cat-salary',
  direct_dep: 'cat-salary',
  freelance: 'cat-freelance',
  upwork: 'cat-freelance',
  fiverr: 'cat-freelance',
  stripe: 'cat-freelance',
  dividend: 'cat-investments',
  interest: 'cat-investments',
};
