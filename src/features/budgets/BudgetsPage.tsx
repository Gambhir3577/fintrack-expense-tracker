import React, { useState, useMemo } from 'react';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { format, subMonths, addMonths, parse } from 'date-fns';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { calculateMonthlyCategorySpending, calculateMonthlyBudgetOverview } from '../../utils/budgetCalculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { IconRenderer } from '../../components/common/IconRenderer';
import { BudgetModal } from './BudgetModal';
import { Category } from '../../types';

export const BudgetsPage: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { budgets, selectedPeriod, setSelectedPeriod } = useBudgetStore();
  const { baseCurrency, convert, rates } = useCurrencyStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const parsedCurrentPeriodDate = useMemo(() => {
    try {
      return parse(selectedPeriod, 'yyyy-MM', new Date());
    } catch {
      return new Date();
    }
  }, [selectedPeriod]);

  // Period navigation
  const handlePrevMonth = () => {
    const prev = subMonths(parsedCurrentPeriodDate, 1);
    setSelectedPeriod(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const next = addMonths(parsedCurrentPeriodDate, 1);
    setSelectedPeriod(format(next, 'yyyy-MM'));
  };

  // Convert transactions and budget limits to baseCurrency
  const convertedTransactions = useMemo(() => {
    return transactions.map((t) => ({
      ...t,
      amount: convert(t.amount),
    }));
  }, [transactions, convert, baseCurrency, rates]);

  const convertedBudgets = useMemo(() => {
    return budgets.map((b) => ({
      ...b,
      monthlyLimit: convert(b.monthlyLimit),
    }));
  }, [budgets, convert, baseCurrency, rates]);

  // Spending calculations for selected period
  const { summaries, overview } = useMemo(() => {
    const s = calculateMonthlyCategorySpending(convertedTransactions, categories, convertedBudgets, selectedPeriod);
    const o = calculateMonthlyBudgetOverview(s, parsedCurrentPeriodDate);
    return { summaries: s, overview: o };
  }, [convertedTransactions, categories, convertedBudgets, selectedPeriod, parsedCurrentPeriodDate]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Budget Goals
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-400">
              Track category spending limits and maintain financial discipline
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              {baseCurrency}
            </span>
          </div>
        </div>

        {/* Period Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-3 text-sm font-bold text-slate-100 min-w-[120px] text-center">
            {format(parsedCurrentPeriodDate, 'MMMM yyyy')}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top Overview KPI Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Total Monthly Budget
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatCurrency(overview.totalBudget, baseCurrency)}
            </h3>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Total Spent
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatCurrency(overview.totalSpent, baseCurrency)}
            </h3>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Remaining Safe to Spend
            </p>
            <h3
              className={`text-2xl sm:text-3xl font-extrabold ${
                overview.totalRemaining > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(overview.totalRemaining, baseCurrency)}
            </h3>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Month Pacing
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-white">
                {overview.daysRemaining} days left
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  overview.isPacingFast
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {overview.isPacingFast ? 'Fast Pace' : 'On Track'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300">
              Overall Budget Consumption: {formatPercent(overview.overallPercentage)}
            </span>
            <span className="text-slate-400">
              Target Pace: {formatPercent(overview.expectedBurnPercentage)} of month elapsed
            </span>
          </div>

          <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overview.overallPercentage > 100
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                  : overview.overallPercentage >= 80
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, overview.overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget Limit Alerts */}
      {overview.overBudgetCategoriesCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-fade-in shadow-lg">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <div className="text-xs sm:text-sm">
            <strong>Action Needed:</strong> {overview.overBudgetCategoriesCount} category budget{overview.overBudgetCategoriesCount > 1 ? 's have' : ' has'} been exceeded for {format(parsedCurrentPeriodDate, 'MMMM yyyy')}. Consider reallocating funds.
          </div>
        </div>
      )}

      {/* Category Budget Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Category Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((item) => {
            const hasBudget = item.budgetLimit > 0;
            let barColor = 'bg-emerald-500';
            if (item.isOverBudget) barColor = 'bg-rose-500';
            else if (item.isNearLimit) barColor = 'bg-amber-500';

            return (
              <div
                key={item.category.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 hover:border-slate-700/80 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 border"
                      style={{
                        backgroundColor: `${item.category.color}18`,
                        borderColor: `${item.category.color}35`,
                        color: item.category.color,
                      }}
                    >
                      <IconRenderer name={item.category.icon} className="w-5 h-5" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{item.category.name}</h4>
                      <p className="text-xs text-slate-400">
                        {item.transactionCount} transaction{item.transactionCount === 1 ? '' : 's'} this month
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingCategory(item.category)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit category budget limit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar & Amounts */}
                {hasBudget ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {formatCurrency(item.spent, baseCurrency)}
                        <span className="font-normal text-slate-400"> of {formatCurrency(item.budgetLimit, baseCurrency)}</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          item.isOverBudget
                            ? 'text-rose-400'
                            : item.isNearLimit
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {formatPercent(item.percentageUsed)}
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, item.percentageUsed)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      {item.isOverBudget ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Over budget by {formatCurrency(item.spent - item.budgetLimit, baseCurrency)}
                        </span>
                      ) : item.isNearLimit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Near limit — {formatCurrency(item.remaining, baseCurrency)} left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {formatCurrency(item.remaining, baseCurrency)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Spent so far:</span>
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(item.spent, baseCurrency)}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditingCategory(item.category)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Set Budget Limit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Set/Edit Modal */}
      {editingCategory && (
        <BudgetModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          currentLimit={
            budgets.find((b) => b.categoryId === editingCategory.id && b.period === selectedPeriod)
              ?.monthlyLimit ?? editingCategory.budgetLimit ?? 0
          }
          period={selectedPeriod}
        />
      )}
    </div>
  );
};
