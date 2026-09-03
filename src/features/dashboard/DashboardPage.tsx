import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Plus,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { calculateMonthlyCategorySpending, calculateMonthlyBudgetOverview, calculateSavingsRate } from '../../utils/budgetCalculations';
import { useRecurringStore } from '../../store/useRecurringStore';
import { FinancialContext } from '../../lib/aiService';
import { differenceInDays, endOfMonth } from 'date-fns';
import { DashboardAICommandBar } from './components/DashboardAICommandBar';
import { AIInsightsWidget } from './components/AIInsightsWidget';
import { FinancialMilestoneWidget } from './components/FinancialMilestoneWidget';
import { StatCard } from '../../components/common/StatCard';
import { CashFlowTrendChart } from './components/CashFlowTrendChart';
import { ExpenseCategoryDonutChart } from './components/ExpenseCategoryDonutChart';
import { MonthlyComparisonBarChart } from './components/MonthlyComparisonBarChart';
import { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
import { BudgetHealthWidget } from './components/BudgetHealthWidget';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { loadDemoData } from '../../db/seedData';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { budgets, loadBudgets } = useBudgetStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency, convert, rates } = useCurrencyStore();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const lastMonthStr = format(subMonths(now, 1), 'yyyy-MM');

  // KPI Calculations with Live Currency Conversion
  const metrics = useMemo(() => {
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    transactions.forEach((tx) => {
      const convertedAmount = convert(tx.amount);
      const isCurrentMonth = tx.date.startsWith(currentMonthStr);
      const isLastMonth = tx.date.startsWith(lastMonthStr);

      if (tx.type === 'income') {
        totalAllTimeIncome += convertedAmount;
        if (isCurrentMonth) currentMonthIncome += convertedAmount;
        if (isLastMonth) lastMonthIncome += convertedAmount;
      } else {
        totalAllTimeExpense += convertedAmount;
        if (isCurrentMonth) currentMonthExpense += convertedAmount;
        if (isLastMonth) lastMonthExpense += convertedAmount;
      }
    });

    const netBalance = totalAllTimeIncome - totalAllTimeExpense;
    const savingsRate = calculateSavingsRate(currentMonthIncome, currentMonthExpense);
    const lastMonthSavingsRate = calculateSavingsRate(lastMonthIncome, lastMonthExpense);

    // Month-over-month trend percentages
    const incomeTrend = lastMonthIncome > 0
      ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
      : 0;

    const expenseTrend = lastMonthExpense > 0
      ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
      : 0;

    const savingsRateDiff = savingsRate - lastMonthSavingsRate;

    return {
      netBalance,
      currentMonthIncome,
      currentMonthExpense,
      savingsRate,
      incomeTrend,
      expenseTrend,
      savingsRateDiff,
    };
  }, [transactions, currentMonthStr, lastMonthStr, baseCurrency, rates, convert]);

  // Convert transactions for budget calculations
  const convertedTransactions = useMemo(() => {
    return transactions.map((tx) => ({
      ...tx,
      amount: convert(tx.amount),
    }));
  }, [transactions, convert, baseCurrency, rates]);

  // Converted budgets
  const convertedBudgets = useMemo(() => {
    return budgets.map((b) => ({
      ...b,
      monthlyLimit: convert(b.monthlyLimit),
    }));
  }, [budgets, convert, baseCurrency, rates]);

  // Budget calculations
  const { spendingSummaries, budgetOverview } = useMemo(() => {
    const summaries = calculateMonthlyCategorySpending(convertedTransactions, categories, convertedBudgets, currentMonthStr);
    const overview = calculateMonthlyBudgetOverview(summaries, now);
    return { spendingSummaries: summaries, budgetOverview: overview };
  }, [convertedTransactions, categories, convertedBudgets, currentMonthStr]);

  const { rules } = useRecurringStore();

  const financialContext: FinancialContext = useMemo(() => {
    const daysRemaining = differenceInDays(endOfMonth(now), now);

    const catSpendMap = new Map<string, number>();
    transactions.forEach((tx) => {
      const isCurrentMonth = tx.date.startsWith(currentMonthStr);
      if (tx.type === 'expense' && isCurrentMonth) {
        const converted = convert(tx.amount);
        catSpendMap.set(tx.categoryId, (catSpendMap.get(tx.categoryId) || 0) + converted);
      }
    });

    const topExpenseCategories = Array.from(catSpendMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId) || {
          id: catId,
          name: 'Other',
          icon: 'Tag',
          color: '#64748B',
          type: 'expense' as const,
        };
        return {
          category: cat,
          amount,
          percentage: metrics.currentMonthExpense > 0 ? (amount / metrics.currentMonthExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const overBudgetCategories: Array<{ category: any; spent: number; limit: number; excess: number }> = [];
    topExpenseCategories.forEach(({ category, amount }) => {
      const goal = budgets.find((b) => b.categoryId === category.id && b.period === currentMonthStr);
      const limit = goal ? convert(goal.monthlyLimit) : (category.budgetLimit ? convert(category.budgetLimit) : 0);
      if (limit > 0 && amount > limit) {
        overBudgetCategories.push({
          category,
          spent: amount,
          limit,
          excess: amount - limit,
        });
      }
    });

    const upcomingRecurring = rules
      .filter((r) => r.isActive)
      .map((r) => ({
        rule: r,
        category: categories.find((c) => c.id === r.template.categoryId),
      }));

    return {
      netBalance: metrics.netBalance,
      monthlyIncome: metrics.currentMonthIncome,
      monthlyExpense: metrics.currentMonthExpense,
      savingsRate: metrics.savingsRate,
      baseCurrency,
      topExpenseCategories,
      overBudgetCategories,
      upcomingRecurring,
      daysRemainingInMonth: Math.max(0, daysRemaining),
      recentTransactions: transactions.slice(0, 10),
      categories,
    };
  }, [transactions, categories, budgets, rules, metrics, baseCurrency, convert, currentMonthStr, now]);

  const handleLoadDemo = async () => {
    try {
      await loadDemoData();
      await Promise.all([loadTransactions(), loadCategories(), loadBudgets()]);
      showToast('Loaded 90 days of sample demo data!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to load demo data', 'error');
    }
  };

  const currencySymbol = CURRENCY_CONFIGS[baseCurrency]?.symbol || '$';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Financial Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span>Overview for <strong className="text-slate-200">{format(now, 'MMMM yyyy')}</strong></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              {baseCurrency}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {transactions.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Load Demo Data
            </button>
          )}

          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-400" />
            Import CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Flagship AI Command Bar */}
      <div className="animate-slide-up delay-1">
        <DashboardAICommandBar />
      </div>

      {/* 4 KPI Summary Cards with Animated Number Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up delay-2">
        <StatCard
          title="Total Net Balance"
          value={formatCurrency(metrics.netBalance, baseCurrency)}
          rawNumericValue={metrics.netBalance}
          currencyPrefix={currencySymbol}
          subtitle={`Converted to ${baseCurrency}`}
          icon={Wallet}
          iconColor="text-emerald-400"
          iconBgColor="bg-emerald-500/10 border-emerald-500/20"
          gradientBorder={true}
        />

        <StatCard
          title="Monthly Income"
          value={formatCurrency(metrics.currentMonthIncome, baseCurrency)}
          rawNumericValue={metrics.currentMonthIncome}
          currencyPrefix={currencySymbol}
          trend={{
            value: metrics.incomeTrend,
            label: 'vs last month',
            isPositiveGood: true,
          }}
          icon={ArrowUpRight}
          iconColor="text-emerald-400"
          iconBgColor="bg-emerald-500/10 border-emerald-500/20"
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(metrics.currentMonthExpense, baseCurrency)}
          rawNumericValue={metrics.currentMonthExpense}
          currencyPrefix={currencySymbol}
          trend={{
            value: metrics.expenseTrend,
            label: 'vs last month',
            isPositiveGood: false, // lower expense is good!
          }}
          icon={ArrowDownLeft}
          iconColor="text-rose-400"
          iconBgColor="bg-rose-500/10 border-rose-500/20"
        />

        <StatCard
          title="Savings Rate"
          value={formatPercent(metrics.savingsRate)}
          trend={{
            value: metrics.savingsRateDiff,
            label: 'pts vs last month',
            isPositiveGood: true,
          }}
          icon={PiggyBank}
          iconColor="text-cyan-400"
          iconBgColor="bg-cyan-500/10 border-cyan-500/20"
        />
      </div>

      {/* Interactive Financial Milestone & XP Streak Widget */}
      <div className="animate-slide-up delay-3">
        <FinancialMilestoneWidget
          financialContext={financialContext}
          transactionCount={transactions.length}
        />
      </div>

      {/* Autonomous AI Insights & Anomaly Alert Hub */}
      <div className="animate-slide-up delay-4">
        <AIInsightsWidget financialContext={financialContext} />
      </div>

      {/* Top Charts Row: Cash Flow Trend (2 cols) + Category Donut (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-5">
        <div className="lg:col-span-2">
          <CashFlowTrendChart transactions={convertedTransactions} />
        </div>
        <div className="lg:col-span-1">
          <ExpenseCategoryDonutChart transactions={convertedTransactions} categories={categories} />
        </div>
      </div>

      {/* Second Charts Row: Monthly Bar Chart (2 cols) + Budget Health (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyComparisonBarChart transactions={convertedTransactions} />
        </div>
        <div className="lg:col-span-1">
          <BudgetHealthWidget
            overview={budgetOverview}
            topSummaries={spendingSummaries}
          />
        </div>
      </div>

      {/* Bottom Section: Recent Transactions Feed */}
      <div>
        <RecentTransactionsWidget
          transactions={transactions}
          categories={categories}
          onSelectTransaction={(tx) => setEditingTransaction(tx)}
        />
      </div>

      {/* Transaction Modals */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <TransactionFormModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        initialData={editingTransaction}
      />
    </div>
  );
};
