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
import { format, subMonths, startOfMonth } from 'date-fns';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { calculateMonthlyCategorySpending, calculateMonthlyBudgetOverview, calculateSavingsRate } from '../../utils/budgetCalculations';
import { StatCard } from '../../components/common/StatCard';
import { CashFlowTrendChart } from './components/CashFlowTrendChart';
import { ExpenseCategoryDonutChart } from './components/ExpenseCategoryDonutChart';
import { MonthlyComparisonBarChart } from './components/MonthlyComparisonBarChart';
import { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
import { BudgetHealthWidget } from './components/BudgetHealthWidget';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { loadDemoData } from '../../db/seedData';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { budgets, loadBudgets } = useBudgetStore();
  const { settings, showToast } = useSettingsStore();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const lastMonthStr = format(subMonths(now, 1), 'yyyy-MM');

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    transactions.forEach((tx) => {
      const isCurrentMonth = tx.date.startsWith(currentMonthStr);
      const isLastMonth = tx.date.startsWith(lastMonthStr);

      if (tx.type === 'income') {
        totalAllTimeIncome += tx.amount;
        if (isCurrentMonth) currentMonthIncome += tx.amount;
        if (isLastMonth) lastMonthIncome += tx.amount;
      } else {
        totalAllTimeExpense += tx.amount;
        if (isCurrentMonth) currentMonthExpense += tx.amount;
        if (isLastMonth) lastMonthExpense += tx.amount;
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
  }, [transactions, currentMonthStr, lastMonthStr]);

  // Budget calculations
  const { spendingSummaries, budgetOverview } = useMemo(() => {
    const summaries = calculateMonthlyCategorySpending(transactions, categories, budgets, currentMonthStr);
    const overview = calculateMonthlyBudgetOverview(summaries, now);
    return { spendingSummaries: summaries, budgetOverview: overview };
  }, [transactions, categories, budgets, currentMonthStr]);

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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview for <span className="text-slate-200 font-semibold">{format(now, 'MMMM yyyy')}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {transactions.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Load Demo Data
            </button>
          )}

          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-slate-400" />
            Import CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Transaction
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Net Balance"
          value={formatCurrency(metrics.netBalance, settings.currency)}
          subtitle="Cumulative net worth"
          icon={Wallet}
          iconColor="text-emerald-400"
          iconBgColor="bg-emerald-500/10 border-emerald-500/20"
          gradientBorder={true}
        />

        <StatCard
          title="Monthly Income"
          value={formatCurrency(metrics.currentMonthIncome, settings.currency)}
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
          value={formatCurrency(metrics.currentMonthExpense, settings.currency)}
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

      {/* Top Charts Row: Cash Flow Trend (2 cols) + Category Donut (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowTrendChart transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <ExpenseCategoryDonutChart transactions={transactions} categories={categories} />
        </div>
      </div>

      {/* Second Charts Row: Monthly Bar Chart (2 cols) + Budget Health (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyComparisonBarChart transactions={transactions} />
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
