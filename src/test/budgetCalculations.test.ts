import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyCategorySpending,
  calculateMonthlyBudgetOverview,
  calculateSavingsRate,
} from '../utils/budgetCalculations';
import { Transaction, BudgetGoal, Category } from '../types';

describe('Budget Calculations & Health Metrics', () => {
  const transactions: Transaction[] = [
    {
      id: 't-1',
      date: '2026-08-05',
      description: 'Grocery Run',
      amount: 400,
      type: 'expense',
      categoryId: 'cat-groceries',
      isRecurring: false,
      createdAt: '2026-08-05T10:00:00Z',
      updatedAt: '2026-08-05T10:00:00Z',
    },
    {
      id: 't-2',
      date: '2026-08-10',
      description: 'Fancy Dinner Out',
      amount: 600,
      type: 'expense',
      categoryId: 'cat-food',
      isRecurring: false,
      createdAt: '2026-08-10T10:00:00Z',
      updatedAt: '2026-08-10T10:00:00Z',
    },
    {
      id: 't-3',
      date: '2026-07-20', // Previous month
      amount: 300,
      type: 'expense',
      description: 'Last month meal',
      categoryId: 'cat-food',
      isRecurring: false,
      createdAt: '2026-07-20T10:00:00Z',
      updatedAt: '2026-07-20T10:00:00Z',
    },
  ];

  const budgetGoals: BudgetGoal[] = [
    { id: 'b-1', categoryId: 'cat-groceries', monthlyLimit: 450, period: '2026-08' },
    { id: 'b-2', categoryId: 'cat-food', monthlyLimit: 500, period: '2026-08' },
  ];

  const testCategories: Category[] = [
    { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#14B8A6', type: 'expense' },
    { id: 'cat-food', name: 'Food & Dining', icon: 'Utensils', color: '#EF4444', type: 'expense' },
  ];

  it('should calculate monthly category spending correctly for target month', () => {
    const summaries = calculateMonthlyCategorySpending(
      transactions,
      testCategories,
      budgetGoals,
      '2026-08'
    );

    const foodSummary = summaries.find((s) => s.category.id === 'cat-food');
    const grocerySummary = summaries.find((s) => s.category.id === 'cat-groceries');

    expect(foodSummary).toBeDefined();
    expect(foodSummary?.spent).toBe(600);
    expect(foodSummary?.budgetLimit).toBe(500);
    expect(foodSummary?.isOverBudget).toBe(true);
    expect(foodSummary?.percentageUsed).toBe(120);

    expect(grocerySummary).toBeDefined();
    expect(grocerySummary?.spent).toBe(400);
    expect(grocerySummary?.budgetLimit).toBe(450);
    expect(grocerySummary?.isOverBudget).toBe(false);
    expect(grocerySummary?.isNearLimit).toBe(true); // 400 / 450 = 88.8% (>= 80%)
    expect(grocerySummary?.remaining).toBe(50);
  });

  it('should compute monthly budget overview and pacing correctly', () => {
    const summaries = calculateMonthlyCategorySpending(
      transactions,
      testCategories,
      budgetGoals,
      '2026-08'
    );

    const overview = calculateMonthlyBudgetOverview(summaries, new Date('2026-08-16'));

    expect(overview.totalBudget).toBe(950); // 450 + 500
    expect(overview.totalSpent).toBe(1000); // 400 + 600
    expect(overview.overallPercentage).toBeCloseTo(105.26, 1);
    expect(overview.overBudgetCategoriesCount).toBe(1);
    expect(overview.nearLimitCategoriesCount).toBe(1);
    expect(overview.daysRemaining).toBe(15); // 31 - 16
  });

  it('should calculate savings rate percentage correctly', () => {
    expect(calculateSavingsRate(5000, 3000)).toBe(40);
    expect(calculateSavingsRate(4000, 4000)).toBe(0);
    expect(calculateSavingsRate(3000, 4000)).toBe(0); // No negative savings rate
    expect(calculateSavingsRate(0, 100)).toBe(0);
  });
});
