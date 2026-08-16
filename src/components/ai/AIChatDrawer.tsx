import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Check,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  Plus,
  Compass,
} from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { FinancialContext, ParsedTransactionDraft, FinancialAuditResult } from '../../lib/aiService';
import { Category } from '../../types';
import { formatCurrency, formatPercent, formatDateString } from '../../utils/formatters';
import { format, differenceInDays, endOfMonth } from 'date-fns';

export const AIChatDrawer: React.FC = () => {
  const { isOpen, setIsOpen, messages, isThinking, sendMessage, confirmTransactionDraft, clearChat, keyConfig } = useAIStore();
  
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { budgets, selectedPeriod } = useBudgetStore();
  const { rules } = useRecurringStore();
  const { baseCurrency, convert } = useCurrencyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isThinking]);

  // Build live financial context snapshot
  const financialContext: FinancialContext = useMemo(() => {
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const daysRemaining = differenceInDays(endOfMonth(now), now);

    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    const catSpendMap = new Map<string, number>();

    transactions.forEach((tx) => {
      const converted = convert(tx.amount);
      const isCurrentMonth = tx.date.startsWith(currentMonthStr);

      if (tx.type === 'income') {
        totalAllTimeIncome += converted;
        if (isCurrentMonth) currentMonthIncome += converted;
      } else {
        totalAllTimeExpense += converted;
        if (isCurrentMonth) {
          currentMonthExpense += converted;
          catSpendMap.set(tx.categoryId, (catSpendMap.get(tx.categoryId) || 0) + converted);
        }
      }
    });

    const netBalance = totalAllTimeIncome - totalAllTimeExpense;
    const savingsRate = currentMonthIncome > 0
      ? Math.max(0, ((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100)
      : 0;

    // Top categories
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
          percentage: currentMonthExpense > 0 ? (amount / currentMonthExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Over budget categories
    const overBudgetCategories: Array<{ category: Category; spent: number; limit: number; excess: number }> = [];
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

    // Upcoming recurring rules
    const upcomingRecurring = rules
      .filter((r) => r.isActive)
      .map((r) => ({
        rule: r,
        category: categories.find((c) => c.id === r.template.categoryId),
      }));

    return {
      netBalance,
      monthlyIncome: currentMonthIncome,
      monthlyExpense: currentMonthExpense,
      savingsRate,
      baseCurrency,
      topExpenseCategories,
      overBudgetCategories,
      upcomingRecurring,
      daysRemainingInMonth: Math.max(0, daysRemaining),
      recentTransactions: transactions.slice(0, 10),
      categories,
    };
  }, [transactions, categories, budgets, rules, baseCurrency, convert]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isThinking) return;
    const p = inputPrompt;
    setInputPrompt('');
    sendMessage(p, financialContext);
  };

  const handleChipClick = (promptText: string) => {
    sendMessage(promptText, financialContext);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-Over Drawer */}
      <div className="relative w-full max-w-lg bg-slate-900/95 border-l border-slate-800 h-full flex flex-col shadow-2xl backdrop-blur-2xl animate-fade-in z-10">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">FinTrack Copilot</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {keyConfig.provider === 'local' ? 'Local AI Engine' : `${keyConfig.provider.toUpperCase()} Pro`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context: {baseCurrency} • Live Local Vault</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={clearChat}
              title="Clear Conversation"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs sm:text-sm animate-fade-in ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`space-y-3 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-sm shadow-md'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-sm shadow-inner'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Interactive Action Cards */}
                  {msg.actionCard?.type === 'transaction_draft' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          Transaction Draft
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{msg.actionCard.data.date}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <h4 className="text-sm font-bold text-white">{msg.actionCard.data.description}</h4>
                          <p className="text-xs text-slate-400">{msg.actionCard.data.categoryName}</p>
                        </div>
                        <span
                          className={`text-base font-mono font-extrabold ${
                            msg.actionCard.data.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {msg.actionCard.data.type === 'income' ? '+' : '-'}
                          {formatCurrency(msg.actionCard.data.amount, baseCurrency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => confirmTransactionDraft(msg.actionCard!.data as ParsedTransactionDraft)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirm & Record to Vault</span>
                      </button>
                    </div>
                  )}

                  {msg.actionCard?.type === 'audit_report' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Health Score</h4>
                        </div>
                        <span className="text-sm font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {msg.actionCard.data.grade} ({msg.actionCard.data.score}/100)
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-200">{msg.actionCard.data.headline}</p>

                      <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                        {msg.actionCard.data.strengths.slice(0, 2).map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-emerald-400">
                            <span>✓</span> <span className="text-slate-300">{s}</span>
                          </div>
                        ))}
                        {msg.actionCard.data.risks.slice(0, 2).map((r: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-rose-400">
                            <span>⚠</span> <span className="text-slate-300">{r}</span>
                          </div>
                        ))}
                      </div>

                      {msg.actionCard.data.projectedSavings > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                          <span>Potential Monthly Savings:</span>
                          <strong className="font-mono font-bold text-white">
                            +{formatCurrency(msg.actionCard.data.projectedSavings, baseCurrency)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.actionCard?.type === 'forecast_card' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Average Daily Burn:</span>
                        <strong className="font-mono text-white">
                          {formatCurrency(msg.actionCard.data.dailyBurnRate, baseCurrency)}/day
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Projected Month Expense:</span>
                        <strong className="font-mono text-slate-200">
                          {formatCurrency(msg.actionCard.data.totalProjectedMonthExpense, baseCurrency)}
                        </strong>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-300 font-bold">Projected Net Savings:</span>
                        <strong
                          className={`font-mono font-extrabold ${
                            msg.actionCard.data.isPositivePacing ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(msg.actionCard.data.projectedNetSavings, baseCurrency)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex gap-3 text-xs animate-fade-in">
              <div className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChipClick('Audit my financial health')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Health</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('Forecast my cash flow')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Forecast Cash Flow</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('Where did most of my money go?')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Top Expenses</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('How can I save more this month?')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Savings Advice</span>
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder='Ask a query or type "Paid ₹850 for dinner today"...'
            disabled={isThinking}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isThinking}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

      </div>
    </div>
  );
};
