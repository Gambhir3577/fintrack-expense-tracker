import React, { useState } from 'react';
import { Sparkles, Send, Bot, Check, ArrowRight, Activity, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { useAIStore } from '../../../store/useAIStore';
import { useCategoryStore } from '../../../store/useCategoryStore';
import { useTransactionStore } from '../../../store/useTransactionStore';
import { useCurrencyStore } from '../../../store/currencyStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { parseNaturalLanguageTransaction, ParsedTransactionDraft } from '../../../lib/aiService';
import { formatCurrency } from '../../../utils/formatters';
import { AIWaveform } from '../../../components/common/AIWaveform';
import confetti from 'canvas-confetti';

export const DashboardAICommandBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<ParsedTransactionDraft | null>(null);
  const { categories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();
  const { baseCurrency } = useCurrencyStore();
  const { showToast } = useSettingsStore();
  const { toggleOpen, isThinking } = useAIStore();

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim().length > 4) {
      const parsed = parseNaturalLanguageTransaction(val, categories, baseCurrency);
      if (parsed && parsed.confidence >= 0.7) {
        setDraft(parsed);
      } else {
        setDraft(null);
      }
    } else {
      setDraft(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (draft) {
      handleConfirmDraft();
    } else {
      // Open AI copilot drawer with query
      toggleOpen();
    }
  };

  const handleConfirmDraft = async () => {
    if (!draft) return;
    try {
      await addTransaction({
        description: draft.description,
        amount: draft.amount,
        type: draft.type,
        categoryId: draft.categoryId,
        date: draft.date,
        isRecurring: false,
        notes: 'AI logged entry',
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      showToast(`AI logged: ${draft.description} (${formatCurrency(draft.amount, baseCurrency)})`, 'success');
      setQuery('');
      setDraft(null);
    } catch (err) {
      showToast('Failed to record transaction', 'error');
    }
  };

  const handleQuickChip = (_promptText: string) => {
    toggleOpen();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 border border-indigo-500/30 p-4 sm:p-5 shadow-xl shadow-indigo-950/30 backdrop-blur-xl">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                FinTrack AI Financial Intelligence
                <AIWaveform isActive={true} />
              </h2>
              <p className="text-xs text-slate-400">
                Type natural language transactions or ask AI for financial advice
              </p>
            </div>
          </div>

          <button
            onClick={toggleOpen}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open AI Copilot</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder='Try "Paid ₹450 for lunch at Subway" or "Audit my financial health"...'
            className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 pl-4 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner transition-all"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {draft ? (
              <button
                type="button"
                onClick={handleConfirmDraft}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Entry</span>
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Instant NLP Draft Preview if detected */}
        {draft && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                Detected {draft.type}
              </span>
              <span className="font-semibold text-white">{draft.description}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(draft.amount, baseCurrency)}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Category: <strong className="text-white">{draft.categoryName}</strong></span>
            </div>
            <button
              onClick={handleConfirmDraft}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
            >
              Confirm & Save <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick AI Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400 scrollbar-none">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0">
            Quick Prompts:
          </span>
          <button
            onClick={() => handleQuickChip('Audit my financial health')}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Health Audit</span>
          </button>
          <button
            onClick={() => handleQuickChip('Forecast my end of month cash flow')}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <TrendingUp className="w-3 h-3 text-indigo-400" />
            <span>Cash Flow Forecast</span>
          </button>
          <button
            onClick={() => handleQuickChip('How can I save 15% more this month?')}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Savings Optimizer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
