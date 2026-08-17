import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Zap,
  Gift,
} from 'lucide-react';
import { useSavingsGoalStore } from '../../store/useSavingsGoalStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { SavingsGoal } from '../../types';
import { formatCurrency, formatPercent, formatDateString } from '../../utils/formatters';
import { IconRenderer } from '../../components/common/IconRenderer';
import { GoalModal } from './GoalModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { differenceInDays, differenceInMonths } from 'date-fns';

export const SavingsGoalsPage: React.FC = () => {
  const { goals, loadGoals, deleteGoal, contributeToGoal } = useSavingsGoalStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Contribute Funds Modal
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isWithdraw, setIsWithdraw] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  // Overall Goals Metrics
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalCurrent = 0;
    let completedCount = 0;

    goals.forEach((g) => {
      totalTarget += g.targetAmount;
      totalCurrent += g.currentAmount;
      if (g.isCompleted) completedCount++;
    });

    const progressPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return {
      totalGoals: goals.length,
      totalTarget,
      totalCurrent,
      completedCount,
      progressPct: Math.min(100, Math.round(progressPct)),
    };
  }, [goals]);

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    const num = parseFloat(contributionAmount);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const delta = isWithdraw ? -num : num;
    const { isCompletedNow } = await contributeToGoal(contributingGoal.id, delta);

    if (isCompletedNow) {
      showToast(`🎉 Goal "${contributingGoal.title}" 100% completed! Congratulations!`, 'success');
    } else {
      showToast(
        isWithdraw
          ? `Withdrew ${formatCurrency(num, baseCurrency)} from ${contributingGoal.title}`
          : `Added ${formatCurrency(num, baseCurrency)} to ${contributingGoal.title}!`,
        'success'
      );
    }

    setContributingGoal(null);
    setContributionAmount('');
    setIsWithdraw(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteGoal(deletingId);
      showToast('Savings goal removed', 'info');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete goal', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Target className="w-5 h-5 stroke-[2.3]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Savings & Investment Goals
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track milestones, dream purchases, and emergency reserves with visual progress
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Saved Across Goals</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(stats.totalCurrent, baseCurrency)}
          </h3>
          <p className="text-xs text-slate-400">Of {formatCurrency(stats.totalTarget, baseCurrency)} cumulative target</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Progress</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{stats.progressPct}%</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {stats.completedCount} / {stats.totalGoals} Completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining to Save</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono">
            {formatCurrency(Math.max(0, stats.totalTarget - stats.totalCurrent), baseCurrency)}
          </h3>
          <p className="text-xs text-slate-400">Needed to complete all open targets</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Goals</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-400">{stats.completedCount}</h3>
            <Gift className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-xs text-slate-400">Milestones achieved & locked in</p>
        </div>

      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const daysLeft = Math.max(0, differenceInDays(new Date(goal.targetDate), new Date()));
          const monthsLeft = Math.max(1, differenceInMonths(new Date(goal.targetDate), new Date()));
          const reqMonthly = remaining > 0 ? Math.round(remaining / monthsLeft) : 0;

          return (
            <div
              key={goal.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xl space-y-4 relative group flex flex-col justify-between ${
                goal.isCompleted
                  ? 'bg-gradient-to-b from-emerald-950/20 to-slate-900/90 border-emerald-500/40 shadow-emerald-500/5'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 border shadow-md"
                      style={{
                        backgroundColor: `${goal.color}20`,
                        borderColor: `${goal.color}40`,
                        color: goal.color,
                      }}
                    >
                      <IconRenderer name={goal.icon} className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white leading-tight">{goal.title}</h4>
                        {goal.isCompleted && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: {formatDateString(goal.targetDate, 'MMM dd, yyyy')} • {daysLeft} days left
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      {formatCurrency(goal.currentAmount, baseCurrency)}
                    </span>
                    <span className="text-slate-400">
                      of <strong className="text-white">{formatCurrency(goal.targetAmount, baseCurrency)}</strong>
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 relative">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#10B981',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span className="font-bold text-white font-mono">{pct}% saved</span>
                    {remaining > 0 ? (
                      <span>
                        Need <strong className="text-emerald-400 font-mono">{formatCurrency(reqMonthly, baseCurrency)}/mo</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Target Reached!</span>
                    )}
                  </div>
                </div>

                {goal.notes && (
                  <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800/60 mt-3">
                    "{goal.notes}"
                  </p>
                )}
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setContributingGoal(goal);
                    setIsWithdraw(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Funds</span>
                </button>

                <button
                  onClick={() => {
                    setContributingGoal(goal);
                    setIsWithdraw(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold transition-all"
                  title="Withdraw Funds"
                >
                  Withdraw
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Contribute Modal */}
      {contributingGoal && (
        <Modal
          isOpen={!!contributingGoal}
          onClose={() => setContributingGoal(null)}
          title={isWithdraw ? `Withdraw Funds: ${contributingGoal.title}` : `Add Funds: ${contributingGoal.title}`}
          maxWidth="sm"
        >
          <form onSubmit={handleContributeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isWithdraw ? 'Withdrawal Amount' : 'Contribution Amount'} ({baseCurrency})
              </label>
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  placeholder="5000"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full bg-transparent pl-9 pr-4 py-2.5 text-lg font-bold text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-2">
              {[1000, 2500, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setContributionAmount(preset.toString())}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-semibold text-slate-300 transition-colors"
                >
                  +{formatCurrency(preset, baseCurrency)}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setContributingGoal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 ${
                  isWithdraw
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isWithdraw ? 'Confirm Withdrawal' : 'Confirm Contribution'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <GoalModal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        initialData={editingGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this goal? Saved progress data will be removed."
        confirmText="Delete"
        variant="danger"
      />

    </div>
  );
};
