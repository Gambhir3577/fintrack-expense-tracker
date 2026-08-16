import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Category, BudgetGoal } from '../../types';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { IconRenderer } from '../../components/common/IconRenderer';
import { Target, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  currentLimit?: number;
  period: string; // 'YYYY-MM'
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  category,
  currentLimit = 0,
  period,
}) => {
  const [limit, setLimit] = useState<string>('');
  const { setBudgetGoal } = useBudgetStore();
  const { settings, showToast } = useSettingsStore();
  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.USD;

  useEffect(() => {
    if (isOpen) {
      setLimit(currentLimit > 0 ? currentLimit.toString() : '');
    }
  }, [isOpen, currentLimit]);

  if (!category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit < 0) {
      showToast('Please enter a valid non-negative amount', 'error');
      return;
    }

    try {
      await setBudgetGoal(category.id, numLimit, period);
      showToast(`Budget limit set for ${category.name}`, 'success');

      // Trigger celebratory micro-confetti
      if (numLimit > 0) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#06B6D4', '#8B5CF6'],
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to update budget goal', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Category Budget"
      subtitle={`Configure monthly limit for ${category.name}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: `${category.color}25`, color: category.color }}
          >
            <IconRenderer name={category.icon} className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{category.name}</p>
            <p className="text-xs text-slate-400">Target Period: {period}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Monthly Budget Limit ({currencyConfig.symbol})
          </label>
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              {currencyConfig.symbol}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 500.00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-transparent pl-9 pr-4 py-2.5 text-lg font-bold text-white placeholder-slate-600 focus:outline-none"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enter 0 to remove the monthly limit for this category.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all"
          >
            Save Limit
          </button>
        </div>
      </form>
    </Modal>
  );
};
