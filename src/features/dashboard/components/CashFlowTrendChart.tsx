import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { subDays, format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { Transaction } from '../../../types';
import { formatCurrency, formatCompactCurrency } from '../../../utils/formatters';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface CashFlowTrendChartProps {
  transactions: Transaction[];
}

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({ transactions }) => {
  const [daysRange, setDaysRange] = useState<30 | 90 | 365>(30);
  const { settings } = useSettingsStore();

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, daysRange);

    // Group transactions by date
    const txByDate = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      if (tx.date >= format(startDate, 'yyyy-MM-dd') && tx.date <= format(today, 'yyyy-MM-dd')) {
        const entry = txByDate.get(tx.date) || { income: 0, expense: 0 };
        if (tx.type === 'income') entry.income += tx.amount;
        else entry.expense += tx.amount;
        txByDate.set(tx.date, entry);
      }
    });

    // Generate continuous date range
    const days = eachDayOfInterval({ start: startDate, end: today });
    let runningNet = 0;

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = txByDate.get(dateStr) || { income: 0, expense: 0 };
      const dailyNet = entry.income - entry.expense;
      runningNet += dailyNet;

      return {
        date: dateStr,
        displayDate: format(day, daysRange === 365 ? 'MMM yyyy' : 'MMM dd'),
        income: entry.income,
        expense: entry.expense,
        netFlow: runningNet,
      };
    });
  }, [transactions, daysRange]);

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">Cumulative Cash Flow Trend</h4>
          <p className="text-xs text-slate-400 mt-0.5">Net financial trajectory over selected time horizon</p>
        </div>

        {/* Range Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          {([30, 90, 365] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDaysRange(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                daysRange === r
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === 365 ? '1 Year' : `${r} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No transaction records found for this timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="netFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactCurrency(val, settings.currency)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-xl backdrop-blur-md">
                        <p className="text-xs font-semibold text-slate-300 mb-1.5">{data.date}</p>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-emerald-400 flex items-center justify-between gap-4">
                            <span>Net Cumulative:</span>
                            <span>{formatCurrency(data.netFlow, settings.currency, true)}</span>
                          </p>
                          {data.income > 0 && (
                            <p className="text-slate-300 flex items-center justify-between gap-4">
                              <span className="text-slate-400">Income:</span>
                              <span className="text-emerald-400">+{formatCurrency(data.income, settings.currency)}</span>
                            </p>
                          )}
                          {data.expense > 0 && (
                            <p className="text-slate-300 flex items-center justify-between gap-4">
                              <span className="text-slate-400">Expense:</span>
                              <span className="text-rose-400">-{formatCurrency(data.expense, settings.currency)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="netFlow"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#netFlowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
