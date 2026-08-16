import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Compass,
  Repeat,
  Trash2,
  User,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAIStore } from '../../store/useAIStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCurrencyStore } from '../../store/currencyStore';
import {
  FinancialContext,
  generateFinancialAuditReport,
  generateCashFlowForecast,
  ParsedTransactionDraft,
} from '../../lib/aiService';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { format, differenceInDays, endOfMonth } from 'date-fns';

export const AIAssistantPage: React.FC = () => {
  const { messages, isThinking, sendMessage, confirmTransactionDraft, clearChat, keyConfig } = useAIStore();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { budgets } = useBudgetStore();
  const { rules } = useRecurringStore();
  const { baseCurrency, convert } = useCurrencyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Financial Context
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

  const auditReport = useMemo(() => generateFinancialAuditReport(financialContext), [financialContext]);
  const forecast = useMemo(() => generateCashFlowForecast(financialContext), [financialContext]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isThinking) return;
    const p = inputPrompt;
    setInputPrompt('');
    sendMessage(p, financialContext);
  };

  const handleQuickPrompt = (promptText: string) => {
    sendMessage(promptText, financialContext);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5 stroke-[2.3]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Financial Intelligence
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time automated financial auditing, cash flow forecasting, and natural language assistant
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {keyConfig.provider === 'local' ? 'Local Neural Rules (Offline)' : `${keyConfig.provider.toUpperCase()} Model`}
          </span>

          <Link
            to="/settings"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Configure AI Keys in Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Diagnostics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Health Score Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Financial Health</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Grade {auditReport.grade}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-white">{auditReport.score}</h3>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium truncate">{auditReport.headline}</p>
        </div>

        {/* Daily Burn Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Burn Rate</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {formatCurrency(forecast.dailyBurnRate, baseCurrency)}
            <span className="text-xs text-slate-400 font-normal"> / day</span>
          </h3>
          <p className="text-xs text-slate-400">Based on past {30 - financialContext.daysRemainingInMonth} days velocity</p>
        </div>

        {/* Projected Month-End Balance */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Forecasted Net Savings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h3
            className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              forecast.isPositivePacing ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(forecast.projectedNetSavings, baseCurrency)}
          </h3>
          <p className="text-xs text-slate-400">{financialContext.daysRemainingInMonth} days remaining in cycle</p>
        </div>

        {/* Potential Savings */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identified Savings</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            +{formatCurrency(auditReport.projectedSavings, baseCurrency)}
          </h3>
          <p className="text-xs text-slate-400">By 15% trim on top 2 categories</p>
        </div>
      </div>

      {/* Main Two-Column Layout: Insights + Live Interactive Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Strengths, Risks & Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Key Strengths Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Financial Strengths
            </h4>
            <div className="space-y-2">
              {auditReport.strengths.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Key Risk Factors Card */}
          {auditReport.risks.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Attention Flags
              </h4>
              <div className="space-y-2">
                {auditReport.risks.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Actionable AI Recommendations
            </h4>
            <div className="space-y-2">
              {auditReport.recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <span className="font-bold text-cyan-400">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Full Embedded Chat Workspace (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/85 border border-slate-800 shadow-2xl flex flex-col h-[650px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Copilot Console</h3>
                <p className="text-[11px] text-slate-400">Ask questions, audit spending, or record natural language entries</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs sm:text-sm animate-fade-in ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

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

                    {/* Action Cards */}
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
                  </div>
                </div>
              );
            })}

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
          <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2">
            <button
              onClick={() => handleQuickPrompt('Audit my financial health')}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              📊 Audit Health
            </button>
            <button
              onClick={() => handleQuickPrompt('Forecast my cash flow')}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              🔮 Forecast Cash Flow
            </button>
            <button
              onClick={() => handleQuickPrompt('Where did most of my money go?')}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              🏷️ Top Expenses
            </button>
            <button
              onClick={() => handleQuickPrompt('Paid ₹500 for lunch today')}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              ⚡ "Paid ₹500 for lunch"
            </button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder='Ask anything or type "Paid ₹1,200 for groceries at Blinkit"...'
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

    </div>
  );
};
