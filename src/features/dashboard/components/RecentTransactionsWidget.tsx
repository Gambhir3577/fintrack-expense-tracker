import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Receipt, Repeat } from 'lucide-react';
import { Transaction, Category } from '../../../types';
import { formatCurrency, formatDateString } from '../../../utils/formatters';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { IconRenderer } from '../../../components/common/IconRenderer';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  categories: Category[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  categories,
  onSelectTransaction,
}) => {
  const { settings } = useSettingsStore();
  const recentList = transactions.slice(0, 5);

  const getCategory = (id: string) => {
    return categories.find((c) => c.id === id) || {
      name: 'Uncategorized',
      icon: 'Tag',
      color: '#64748B',
    };
  };

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">Recent Transactions</h4>
          <p className="text-xs text-slate-400 mt-0.5">Latest account inflows and debits</p>
        </div>
        <Link
          to="/transactions"
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {recentList.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No recent transactions found.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {recentList.map((tx) => {
            const cat = getCategory(tx.categoryId);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                className="flex items-center justify-between py-3.5 hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${cat.color}18`,
                      borderColor: `${cat.color}35`,
                      color: cat.color,
                    }}
                  >
                    <IconRenderer name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDateString(tx.date, 'MMM dd')}</span>
                      <span>•</span>
                      <span className="truncate">{cat.name}</span>
                      {tx.isRecurring && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          <Repeat className="w-2.5 h-2.5" /> Recurring
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`text-sm font-bold flex items-center justify-end gap-0.5 ${
                      isIncome ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4 text-slate-500" />}
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
