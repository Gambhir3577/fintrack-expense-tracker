import { Transaction, Category, BudgetGoal, CategorySpendingSummary } from '../types';
import { getDaysInMonth, getDate } from 'date-fns';

export function calculateMonthlyCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  budgetGoals: BudgetGoal[],
  targetPeriod: string // 'YYYY-MM'
): CategorySpendingSummary[] {
  // Filter transactions for this month and expense only
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(targetPeriod)
  );

  const budgetMap = new Map<string, number>();
  budgetGoals
    .filter((b) => b.period === targetPeriod)
    .forEach((b) => budgetMap.set(b.categoryId, b.monthlyLimit));

  // Only consider expense categories or categories that have spending/budgets
  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );

  const summaries: CategorySpendingSummary[] = expenseCategories.map((category) => {
    const categoryTxs = monthExpenses.filter((t) => t.categoryId === category.id);
    const spent = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
    const budgetLimit = budgetMap.get(category.id) ?? category.budgetLimit ?? 0;
    const remaining = budgetLimit > 0 ? budgetLimit - spent : 0;
    const percentageUsed = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
    const isOverBudget = budgetLimit > 0 && spent > budgetLimit;
    const isNearLimit = budgetLimit > 0 && percentageUsed >= 80 && !isOverBudget;

    return {
      category,
      spent,
      budgetLimit,
      percentageUsed,
      remaining,
      isOverBudget,
      isNearLimit,
      transactionCount: categoryTxs.length,
    };
  });

  // Sort: Over-budget first, then highest percentage used, then highest spent
  return summaries.sort((a, b) => {
    if (a.isOverBudget && !b.isOverBudget) return -1;
    if (!a.isOverBudget && b.isOverBudget) return 1;
    if (a.budgetLimit > 0 && b.budgetLimit === 0) return -1;
    if (a.budgetLimit === 0 && b.budgetLimit > 0) return 1;
    return b.percentageUsed - a.percentageUsed;
  });
}

export function calculateMonthlyBudgetOverview(
  spendingSummaries: CategorySpendingSummary[],
  targetDate: Date = new Date()
) {
  const budgetedSummaries = spendingSummaries.filter((s) => s.budgetLimit > 0);
  const totalBudget = budgetedSummaries.reduce((sum, s) => sum + s.budgetLimit, 0);
  const totalSpent = budgetedSummaries.reduce((sum, s) => sum + s.spent, 0);
  const totalAllExpenses = spendingSummaries.reduce((sum, s) => sum + s.spent, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const totalDays = getDaysInMonth(targetDate);
  const currentDay = getDate(targetDate);
  const daysRemaining = Math.max(0, totalDays - currentDay);
  const expectedBurnPercentage = (currentDay / totalDays) * 100;
  const isPacingFast = overallPercentage > expectedBurnPercentage + 10;

  const overBudgetCategoriesCount = budgetedSummaries.filter((s) => s.isOverBudget).length;
  const nearLimitCategoriesCount = budgetedSummaries.filter((s) => s.isNearLimit).length;

  return {
    totalBudget,
    totalSpent,
    totalAllExpenses,
    totalRemaining,
    overallPercentage,
    daysRemaining,
    totalDays,
    currentDay,
    expectedBurnPercentage,
    isPacingFast,
    overBudgetCategoriesCount,
    nearLimitCategoriesCount,
  };
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = income - expenses;
  if (savings <= 0) return 0;
  return Math.min(100, (savings / income) * 100);
}
