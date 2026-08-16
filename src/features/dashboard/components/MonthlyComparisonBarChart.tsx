import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { subMonths, format } from 'date-fns';
import { Transaction } from '../../../types';
import { formatCompactCurrency, formatCurrency } from '../../../utils/formatters';
import { useCurrencyStore } from '../../../store/currencyStore';

interface MonthlyComparisonBarChartProps {
  transactions: Transaction[];
}

export const MonthlyComparisonBarChart: React.FC<MonthlyComparisonBarChartProps> = ({ transactions }) => {
  const { baseCurrency } = useCurrencyStore();

  const chartData = useMemo(() => {
    const months: Array<{ period: string; label: string; income: number; expense: number; net: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const period = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM yyyy');

      const monthTxs = transactions.filter((t) => t.date.startsWith(period));
      const income = monthTxs
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxs
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        period,
        label,
        income,
        expense,
        net: income - expense,
      });
    }

    return months;
  }, [transactions]);

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">Income vs Expenses</h4>
          <p className="text-xs text-slate-400 mt-0.5">Historical comparison in <strong className="text-slate-200">{baseCurrency}</strong></p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatCompactCurrency(val, baseCurrency)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-semibold text-slate-300 mb-2">{data.label}</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2 h-2 rounded-sm bg-emerald-400" /> Income:
                          </span>
                          <span className="font-bold text-white">{formatCurrency(data.income, baseCurrency)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-rose-400">
                            <span className="w-2 h-2 rounded-sm bg-rose-400" /> Expense:
                          </span>
                          <span className="font-bold text-white">{formatCurrency(data.expense, baseCurrency)}</span>
                        </div>
                        <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center justify-between gap-4">
                          <span className="text-slate-400">Net Balance:</span>
                          <span className={`font-bold ${data.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(data.net, baseCurrency, true)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-xs text-slate-300 capitalize">{value}</span>}
            />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
