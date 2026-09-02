import React, { useState } from 'react';
import { Sparkles, Send, Check, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useCategoryStore } from '../../../store/useCategoryStore';
import { useTransactionStore } from '../../../store/useTransactionStore';
import { useCurrencyStore } from '../../../store/currencyStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { parseNaturalLanguageTransaction, ParsedTransactionDraft } from '../../../lib/aiService';
import { formatCurrency } from '../../../utils/formatters';
import confetti from 'canvas-confetti';

export const AITransactionQuickInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<ParsedTransactionDraft | null>(null);
  const { categories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();
  const { baseCurrency } = useCurrencyStore();
  const { showToast } = useSettingsStore();

  const handleInputChange = (val: string) => {
    setInput(val);
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

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });

      showToast(`AI logged: ${draft.description} (${formatCurrency(draft.amount, baseCurrency)})`, 'success');
      setInput('');
      setDraft(null);
    } catch (err) {
      showToast('Failed to record transaction', 'error');
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-indigo-500/20 p-3 sm:p-4 space-y-2.5">
      <form onSubmit={handleSaveDraft} className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 shrink-0 self-start sm:self-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>AI Magic Entry:</span>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder='Type naturally (e.g. "Paid ₹750 for groceries at Zepto yesterday" or "Freelance payment ₹12,000 received")...'
            className="w-full rounded-xl bg-slate-950/80 border border-slate-700/60 pl-3.5 pr-20 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <button
              type="submit"
              disabled={!draft}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                draft
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Record</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Live AI Draft Preview */}
      {draft && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
              {draft.type}
            </span>
            <span className="font-semibold text-white">{draft.description}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(draft.amount, baseCurrency)}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">{draft.categoryName}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{draft.date}</span>
          </div>

          <button
            onClick={() => handleSaveDraft()}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Confirm & Add</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
