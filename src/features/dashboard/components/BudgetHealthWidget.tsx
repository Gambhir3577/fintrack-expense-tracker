import React from 'react';
import { Link } from 'react-router-dom';
import { Target, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { CategorySpendingSummary } from '../../../types';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { useCurrencyStore } from '../../../store/currencyStore';

interface BudgetHealthWidgetProps {
  overview: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    daysRemaining: number;
    overBudgetCategoriesCount: number;
  };
  topSummaries: CategorySpendingSummary[];
}

export const BudgetHealthWidget: React.FC<BudgetHealthWidgetProps> = ({
  overview,
  topSummaries,
}) => {
  const { baseCurrency } = useCurrencyStore();

  const isOver = overview.overallPercentage > 100;
  const isWarning = overview.overallPercentage >= 80 && !isOver;

  let progressColor = 'bg-emerald-500';
  if (isOver) progressColor = 'bg-rose-500';
  else if (isWarning) progressColor = 'bg-amber-500';

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Budget Health</h4>
              <p className="text-xs text-slate-400">Monthly spending pace in <strong className="text-slate-200">{baseCurrency}</strong></p>
            </div>
          </div>

          <Link
            to="/budgets"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Manage <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {overview.totalBudget === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            No category budget limits configured for this month.
            <div className="mt-3">
              <Link
                to="/budgets"
                className="inline-flex px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                Set Budget Limits
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Gauge Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">
                  {formatCurrency(overview.totalSpent, baseCurrency)} spent
                </span>
                <span className="text-slate-400">
                  of {formatCurrency(overview.totalBudget, baseCurrency)} limit
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(100, overview.overallPercentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                <span>{formatPercent(overview.overallPercentage)} used</span>
                <span>{overview.daysRemaining} days remaining in month</span>
              </div>
            </div>

            {/* Status alerts */}
            {overview.overBudgetCategoriesCount > 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  <strong>{overview.overBudgetCategoriesCount}</strong> categor{overview.overBudgetCategoriesCount > 1 ? 'ies have' : 'y has'} exceeded the monthly limit!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>All budgeted categories are currently within limits.</span>
              </div>
            )}

            {/* Quick snippet of top categories */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {topSummaries.slice(0, 3).map((item) => (
                <div key={item.category.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-300 truncate">{item.category.name}</span>
                    <span className={`font-semibold ${item.isOverBudget ? 'text-rose-400' : 'text-slate-400'}`}>
                      {formatCurrency(item.spent, baseCurrency)} / {formatCurrency(item.budgetLimit, baseCurrency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.isOverBudget ? 'bg-rose-500' : item.isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentageUsed)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
