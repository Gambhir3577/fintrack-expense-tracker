import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Transaction, Category } from '../../../types';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { useCurrencyStore } from '../../../store/currencyStore';
import { IconRenderer } from '../../../components/common/IconRenderer';

interface ExpenseCategoryDonutChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export const ExpenseCategoryDonutChart: React.FC<ExpenseCategoryDonutChartProps> = ({
  transactions,
  categories,
}) => {
  const { baseCurrency } = useCurrencyStore();
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const { chartData, totalExpense } = useMemo(() => {
    // Current month expenses
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentMonthStr)
    );

    const categoryMap = new Map<string, number>();
    let total = 0;

    currentMonthExpenses.forEach((tx) => {
      categoryMap.set(tx.categoryId, (categoryMap.get(tx.categoryId) || 0) + tx.amount);
      total += tx.amount;
    });

    const data = Array.from(categoryMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat ? cat.name : 'Other',
          icon: cat ? cat.icon : 'Tag',
          color: cat ? cat.color : '#94A3B8',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { chartData: data, totalExpense: total };
  }, [transactions, categories, currentMonthStr]);

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Category Breakdown</h4>
            <p className="text-xs text-slate-400 mt-0.5">Expenses distribution for this month</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {format(new Date(), 'MMMM yyyy')}
          </span>
        </div>

        {/* Donut Chart with Center Total */}
        <div className="relative h-56 w-full flex items-center justify-center my-2">
          {chartData.length === 0 ? (
            <div className="text-sm text-slate-500">No expenses recorded this month.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-xs font-bold text-white">{d.name}</span>
                            </div>
                            <p className="text-xs font-extrabold text-white">
                              {formatCurrency(d.amount, baseCurrency)} ({formatPercent(d.percentage)})
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Spent</span>
                <span className="text-lg font-extrabold text-white">
                  {formatCurrency(totalExpense, baseCurrency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top 4 Categories Legend */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80">
          {chartData.slice(0, 4).map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{cat.name}</p>
                  <p className="text-[10px] text-slate-400">{formatPercent(cat.percentage)}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-white shrink-0 ml-1">
                {formatCurrency(cat.amount, baseCurrency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
