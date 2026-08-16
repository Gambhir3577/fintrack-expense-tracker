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

  // 1. Create Recurring Rules (in INR)
  const recurringRules: RecurrenceRule[] = [
    {
      id: 'rec-salary',
      frequency: 'monthly',
      startDate: format(subMonths(now, 3), 'yyyy-MM-01'),
      lastGeneratedDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      isActive: true,
      template: {
        description: 'TechCorp Monthly Salary',
        amount: 125000,
        type: 'income',
        categoryId: 'cat-salary',
        notes: 'Direct deposit after EPF & tax deduction',
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
        amount: 32000,
        type: 'expense',
        categoryId: 'cat-housing',
        notes: 'Apartment 3BHK rent via net banking',
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
        amount: 649,
        type: 'expense',
        categoryId: 'cat-subscriptions',
        notes: 'Monthly family plan',
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
        description: 'Cult.fit Gym & Fitness Pass',
        amount: 2499,
        type: 'expense',
        categoryId: 'cat-health',
        notes: 'Monthly gym & yoga membership',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await db.recurringRules.bulkAdd(recurringRules);

  // 2. Create Budget Goals for the current month (in INR)
  const budgetGoals: BudgetGoal[] = [
    { id: `b-${currentMonthStr}-housing`, categoryId: 'cat-housing', monthlyLimit: 35000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-food`, categoryId: 'cat-food', monthlyLimit: 15000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-groceries`, categoryId: 'cat-groceries', monthlyLimit: 12000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-transport`, categoryId: 'cat-transport', monthlyLimit: 8000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-utilities`, categoryId: 'cat-utilities', monthlyLimit: 6000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-entertainment`, categoryId: 'cat-entertainment', monthlyLimit: 5000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-shopping`, categoryId: 'cat-shopping', monthlyLimit: 10000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-health`, categoryId: 'cat-health', monthlyLimit: 5000, period: currentMonthStr, notifyThreshold: 0.8 },
    { id: `b-${currentMonthStr}-subscriptions`, categoryId: 'cat-subscriptions', monthlyLimit: 2000, period: currentMonthStr, notifyThreshold: 0.8 },

    // Last month budgets
    { id: `b-${lastMonthStr}-housing`, categoryId: 'cat-housing', monthlyLimit: 35000, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-food`, categoryId: 'cat-food', monthlyLimit: 15000, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-groceries`, categoryId: 'cat-groceries', monthlyLimit: 12000, period: lastMonthStr, notifyThreshold: 0.8 },
    { id: `b-${lastMonthStr}-transport`, categoryId: 'cat-transport', monthlyLimit: 8000, period: lastMonthStr, notifyThreshold: 0.8 },
  ];

  await db.budgets.bulkAdd(budgetGoals);

  // 3. Generate Realistic Transactions (Past 90 days in INR)
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
  addTx(88, 'TechCorp Monthly Salary', 125000, 'income', 'cat-salary', true, 'rec-salary');
  addTx(87, 'Apartment Monthly Rent', 32000, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(85, 'Nature Basket Grocery Run', 3450, 'expense', 'cat-groceries');
  addTx(82, 'IndianOil Petrol Refill', 2500, 'expense', 'cat-transport');
  addTx(80, 'Cult.fit Gym & Fitness Pass', 2499, 'expense', 'cat-health', true, 'rec-gym');
  addTx(78, 'Swiggy Gourmet Team Lunch', 1250, 'expense', 'cat-food');
  addTx(75, 'Netflix 4K Ultra Subscription', 649, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(73, 'Spotify Premium Annual Plan', 1199, 'expense', 'cat-subscriptions');
  addTx(71, 'Blinkit Superfast Groceries', 1840, 'expense', 'cat-groceries');
  addTx(70, 'Electricity & Power Bill', 2850, 'expense', 'cat-utilities');
  addTx(68, 'Airtel Xstream Fiber Broadband', 1179, 'expense', 'cat-utilities');
  addTx(65, 'Mobile UI/UX Freelance Client', 35000, 'income', 'cat-freelance');
  addTx(64, 'PVR IMAX Movie Tickets & Snacks', 1600, 'expense', 'cat-entertainment');
  addTx(62, 'Amazon Electronics (USB-C Hub)', 2499, 'expense', 'cat-shopping');

  // Month 2 (approx 31-60 days ago)
  addTx(59, 'TechCorp Monthly Salary', 125000, 'income', 'cat-salary', true, 'rec-salary');
  addTx(58, 'Apartment Monthly Rent', 32000, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(56, 'DMart Supermarket Monthly Restock', 6850, 'expense', 'cat-groceries');
  addTx(54, 'Starbucks Coffee & Snacks', 650, 'expense', 'cat-food');
  addTx(51, 'Uber Ride to City Airport', 850, 'expense', 'cat-transport');
  addTx(50, 'Barbeque Nation Dinner with Family', 4200, 'expense', 'cat-food');
  addTx(49, 'Cult.fit Gym & Fitness Pass', 2499, 'expense', 'cat-health', true, 'rec-gym');
  addTx(46, 'Nifty 50 Index Mutual Fund Dividend', 4500, 'income', 'cat-investments');
  addTx(45, 'Netflix 4K Ultra Subscription', 649, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(42, 'HP Petrol Pump Fuel Refill', 2800, 'expense', 'cat-transport');
  addTx(40, 'Tata Power Electricity Bill', 3150, 'expense', 'cat-utilities');
  addTx(38, 'Zepto Instant Grocery Delivery', 1420, 'expense', 'cat-groceries');
  addTx(35, 'Myntra Fashion Shopping', 4500, 'expense', 'cat-shopping');
  addTx(34, 'BookMyShow Live Standup Comedy', 1800, 'expense', 'cat-entertainment');
  addTx(32, 'Upwork React Web Project Payment', 28000, 'income', 'cat-freelance');

  // Current Month (0-30 days ago)
  addTx(29, 'TechCorp Monthly Salary', 125000, 'income', 'cat-salary', true, 'rec-salary');
  addTx(28, 'Apartment Monthly Rent', 32000, 'expense', 'cat-housing', true, 'rec-rent');
  addTx(26, 'BigBasket Organic Vegetable Order', 2640, 'expense', 'cat-groceries');
  addTx(24, 'Ola Cab Airport Commute', 780, 'expense', 'cat-transport');
  addTx(22, 'Third Wave Coffee Roasters', 420, 'expense', 'cat-food');
  addTx(20, 'Cult.fit Gym & Fitness Pass', 2499, 'expense', 'cat-health', true, 'rec-gym');
  addTx(19, 'Broadband Internet & Mobile Recharge', 1499, 'expense', 'cat-utilities');
  addTx(17, 'Punjab Grill Fine Dining Weekend', 3850, 'expense', 'cat-food');
  addTx(15, 'Netflix 4K Ultra Subscription', 649, 'expense', 'cat-subscriptions', true, 'rec-netflix');
  addTx(14, 'IKEA Home Decor & Storage', 4200, 'expense', 'cat-shopping');
  addTx(12, 'Nature Basket Supermarket', 3150, 'expense', 'cat-groceries');
  addTx(10, 'Freelance Fintech Consultation', 42000, 'income', 'cat-freelance');
  addTx(8, 'IndianOil Petrol Fill-up', 2400, 'expense', 'cat-transport');
  addTx(6, 'Apple iCloud & YouTube Premium', 378, 'expense', 'cat-subscriptions');
  addTx(5, 'Sunday Brunch at Social', 1950, 'expense', 'cat-food');
  addTx(3, 'Amazon India Electronics Cable & Book', 999, 'expense', 'cat-shopping');
  addTx(2, 'PVR Cinema Tickets', 800, 'expense', 'cat-entertainment');
  addTx(1, 'Blue Tokai Morning Nitro Brew', 320, 'expense', 'cat-food');
  addTx(0, 'Zomato Biryani Lunch Delivery', 580, 'expense', 'cat-food');

  await db.transactions.bulkAdd(transactions);

  // Update settings onboarding flag to INR
  await db.settings.put({
    id: 'app-settings',
    currency: 'INR',
    theme: 'dark',
    dateFormat: 'YYYY-MM-DD',
    firstDayOfWeek: 1,
    hasCompletedOnboarding: true,
  });
}
