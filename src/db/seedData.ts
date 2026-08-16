import { subDays, subMonths, format, startOfMonth } from 'date-fns';
import { Transaction, RecurrenceRule, BudgetGoal } from '../types';
import { db } from './index';
import { DEFAULT_CATEGORIES } from '../utils/constants';

export async function loadDemoData(): Promise<void> {
  // Clear existing transactions and budgets
  await db.transactions.clear();
  await db.budgets.clear();
  await db.recurringRules.clear();

  // Reset categories to defaults
  await db.categories.clear();
  await db.categories.bulkAdd(DEFAULT_CATEGORIES);

  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const lastMonthStr = format(subMonths(now, 1), 'yyyy-MM');
  const twoMonthsAgoStr = format(subMonths(now, 2), 'yyyy-MM');

  // 1. Create Recurring Rules
  const recurringRules: RecurrenceRule[] = [
    {
      id: 'rec-salary',
      frequency: 'monthly',
      startDate: format(subMonths(now, 3), 'yyyy-MM-01'),
      lastGeneratedDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      isActive: true,
      template: {
        description: 'TechCorp Monthly Salary',
        amount: 5400,
        type: 'income',
        categoryId: 'cat-salary',
        notes: 'Direct deposit after tax & 401k',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-rent',
      frequency: 'monthly',
      startDate: format(subMonths(now, 3), 'yyyy-MM-01'),
      lastGeneratedDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      isActive: true,
      template: {
        description: 'Apartment Monthly Rent',
        amount: 1550,
        type: 'expense',
        categoryId: 'cat-housing',
        notes: 'Unit #402 rent via auto-pay',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-netflix',
      frequency: 'monthly',
      startDate: format(subMonths(now, 3), 'yyyy-MM-15'),
      lastGeneratedDate: format(startOfMonth(now), 'yyyy-MM-15'),
      isActive: true,
      template: {
        description: 'Netflix 4K Ultra Subscription',
        amount: 22.99,
        type: 'expense',
        categoryId: 'cat-subscriptions',
        notes: 'Family plan subscription',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec-gym',
      frequency: 'monthly',
      startDate: format(subMonths(now, 3), 'yyyy-MM-10'),
      lastGeneratedDate: format(startOfMonth(now), 'yyyy-MM-10'),
      isActive: true,
      template: {
        description: 'Equinox Gym Membership',
        amount: 79.00,
        type: 'expense',
        categoryId: 'cat-health',
        notes: 'Monthly wellness & fitness pass',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await db.recurringRules.bulkAdd(recurringRules);

  // 2. Create Budget Goals for the current month
  const budgetGoals: BudgetGoal[] = [
    { id: `b-${currentMonthStr}-housing`, categoryId: 'cat-housing', monthlyLimit: 1600, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-food`, categoryId: 'cat-food', monthlyLimit: 550, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-groceries`, categoryId: 'cat-groceries', monthlyLimit: 450, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-transport`, categoryId: 'cat-transport', monthlyLimit: 280, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-utilities`, categoryId: 'cat-utilities', monthlyLimit: 220, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-entertainment`, categoryId: 'cat-entertainment', monthlyLimit: 200, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-shopping`, categoryId: 'cat-shopping', monthlyLimit: 350, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-health`, categoryId: 'cat-health', monthlyLimit: 150, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-subscriptions`, categoryId: 'cat-subscriptions', monthlyLimit: 75, period: currentMonthStr, notifyThreshold: 0.8 },

    // Last month budgets
    { id: `b-${lastMonthStr}-housing`, categoryId: 'cat-housing', monthlyLimit: 1600, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-food`, categoryId: 'cat-food', monthlyLimit: 550, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-groceries`, categoryId: 'cat-groceries', monthlyLimit: 450, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-transport`, categoryId: 'cat-transport', monthlyLimit: 280, period: lastMonthStr, notifyThreshold: 0.8 },
  ];

  await db.budgets.bulkAdd(budgetGoals);

  // 3. Generate Realistic Transactions (Past 90 days)
  const transactions: Transaction[] = [];

  const addTx = (daysAgo: number, desc: string, amount: number, type: 'income' | 'expense', catId: string, isRec = false, recId?: string) => {
    const d = subDays(now, daysAgo);
    const dateStr = format(d, 'yyyy-MM-dd');
    transactions.push({
      id: `tx-seed-${transactions.length + 1}-${Math.random().toString(36).substring(2, 7)}`,
      date: dateStr,
      description: desc,
      amount,
      type,
      categoryId: catId,
      isRecurring: isRec,
      recurringRuleId: recId,
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    });
  };

  // Month 3 (approx 61-90 days ago)
  addTx(88, 'TechCorp Monthly Salary', 5400, 'income', 'cat-salary', true, 'rec-salary');
  addTx(87, 'Apartment Monthly Rent', 1550, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(85, 'Whole Foods Grocery Run', 124.50, 'expense', 'cat-groceries');
  addTx(82, 'Shell Gas Station Fill-up', 48.20, 'expense', 'cat-transport');
  addTx(80, 'Equinox Gym Membership', 79.00, 'expense', 'cat-health', true, 'rec-gym');
  addTx(78, 'Chipotle Lunch with Team', 18.50, 'expense', 'cat-food');
  addTx(75, 'Netflix 4K Ultra Subscription', 22.99, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(73, 'Spotify Family Plan', 16.99, 'expense', 'cat-subscriptions');
  addTx(71, 'Trader Joe’s Market', 88.40, 'expense', 'cat-groceries');
  addTx(70, 'Electric & Gas Utility Bill', 115.30, 'expense', 'cat-utilities');
  addTx(68, 'High-Speed Fiber Internet', 70.00, 'expense', 'cat-utilities');
  addTx(65, 'Mobile Design Freelance Client', 1250, 'income', 'cat-freelance');
  addTx(64, 'Cinema Tickets - IMAX 3D', 36.00, 'expense', 'cat-entertainment');
  addTx(62, 'Amazon Electronics (USB Hub)', 45.99, 'expense', 'cat-shopping');

  // Month 2 (approx 31-60 days ago)
  addTx(59, 'TechCorp Monthly Salary', 5400, 'income', 'cat-salary', true, 'rec-salary');
  addTx(58, 'Apartment Monthly Rent', 1550, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(56, 'Costco Wholesale Bulk Shopping', 235.80, 'expense', 'cat-groceries');
  addTx(54, 'Starbucks Coffee & Pastry', 9.75, 'expense', 'cat-food');
  addTx(51, 'Uber Ride to Downtown Dinner', 24.50, 'expense', 'cat-transport');
  addTx(50, 'Italian Bistro Dinner Date', 112.00, 'expense', 'cat-food');
  addTx(49, 'Equinox Gym Membership', 79.00, 'expense', 'cat-health', true, 'rec-gym');
  addTx(46, 'S&P 500 Index Dividend Payout', 145.20, 'income', 'cat-investments');
  addTx(45, 'Netflix 4K Ultra Subscription', 22.99, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(42, 'Chevron Gasoline Refill', 52.10, 'expense', 'cat-transport');
  addTx(40, 'Electric & Gas Utility Bill', 128.40, 'expense', 'cat-utilities');
  addTx(38, 'Whole Foods Organic Groceries', 110.25, 'expense', 'cat-groceries');
  addTx(35, 'Nike Air Zoom Running Shoes', 135.00, 'expense', 'cat-shopping');
  addTx(34, 'Steam Weekend Game Sale', 49.99, 'expense', 'cat-entertainment');
  addTx(32, 'Upwork Web Dev Project Payment', 800.00, 'income', 'cat-freelance');

  // Current Month (0-30 days ago)
  addTx(29, 'TechCorp Monthly Salary', 5400, 'income', 'cat-salary', true, 'rec-salary');
  addTx(28, 'Apartment Monthly Rent', 1550, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(26, 'Trader Joe’s Weekly Groceries', 96.30, 'expense', 'cat-groceries');
  addTx(24, 'Uber Ride from Airport', 38.75, 'expense', 'cat-transport');
  addTx(22, 'Blue Bottle Coffee', 7.50, 'expense', 'cat-food');
  addTx(20, 'Equinox Gym Membership', 79.00, 'expense', 'cat-health', true, 'rec-gym');
  addTx(19, 'Electric & Gas Utility Bill', 108.90, 'expense', 'cat-utilities');
  addTx(17, 'Sushi Omakase Dinner', 140.00, 'expense', 'cat-food');
  addTx(15, 'Netflix 4K Ultra Subscription', 22.99, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(14, 'Target Home Essentials', 64.80, 'expense', 'cat-shopping');
  addTx(12, 'Whole Foods Market', 132.40, 'expense', 'cat-groceries');
  addTx(10, 'Freelance UI/UX Advisory', 950.00, 'income', 'cat-freelance');
  addTx(8, 'Shell Fuel Fill-up', 46.50, 'expense', 'cat-transport');
  addTx(6, 'Apple Music & iCloud Subscription', 14.99, 'expense', 'cat-subscriptions');
  addTx(5, 'Artisan Sourdough Bakery & Brunch', 34.20, 'expense', 'cat-food');
  addTx(3, 'Amazon Kindle E-Book & Tech Cable', 28.50, 'expense', 'cat-shopping');
  addTx(2, 'Concert Tickets (Live Band)', 85.00, 'expense', 'cat-entertainment');
  addTx(1, 'Starbucks Morning Nitro Cold Brew', 6.25, 'expense', 'cat-food');
  addTx(0, 'Supermarket Deli Lunch & Snacks', 15.40, 'expense', 'cat-food');

  await db.transactions.bulkAdd(transactions);

  // Update settings onboarding flag
  await db.settings.put({
    id: 'app-settings',
    currency: 'USD',
    theme: 'dark',
    dateFormat: 'YYYY-MM-DD',
    firstDayOfWeek: 1,
    hasCompletedOnboarding: true,
  });
}
