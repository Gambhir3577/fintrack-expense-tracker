import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { RecurrenceRule, Category } from '../../types';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatCurrency, formatDateString } from '../../utils/formatters';
import { computeNextScheduledDate } from '../../utils/recurringEngine';
import { IconRenderer } from '../../components/common/IconRenderer';
import { RecurringRuleModal } from './RecurringRuleModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';

export const RecurringPage: React.FC = () => {
  const { rules, isProcessing, toggleRuleActive, deleteRule, processRecurringRules } = useRecurringStore();
  const { categories } = useCategoryStore();
  const { settings, showToast } = useSettingsStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurrenceRule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Category lookup
  const getCategory = (catId: string) => {
    return (
      categories.find((c) => c.id === catId) || {
        name: 'Uncategorized',
        icon: 'Tag',
        color: '#64748B',
      }
    );
  };

  // Metrics
  const metrics = useMemo(() => {
    let activeCount = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    rules.forEach((rule) => {
      if (!rule.isActive) return;
      activeCount++;

      // Normalize to monthly multiplier
      let mult = 1;
      if (rule.frequency === 'daily') mult = 30;
      else if (rule.frequency === 'weekly') mult = 4.33;
      else if (rule.frequency === 'yearly') mult = 1 / 12;

      const monthlyAmount = rule.template.amount * mult;
      if (rule.template.type === 'income') {
        monthlyIncome += monthlyAmount;
      } else {
        monthlyExpense += monthlyAmount;
      }
    });

    return { activeCount, monthlyIncome, monthlyExpense };
  }, [rules]);

  const handleProcessDue = async () => {
    try {
      const generated = await processRecurringRules();
      if (generated > 0) {
        showToast(`Generated ${generated} new recurring transaction${generated > 1 ? 's' : ''}!`, 'success');
      } else {
        showToast('All recurring rules are up to date.', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Error processing recurring rules', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRule(deletingId);
      showToast('Recurring rule removed', 'info');
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete rule', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Recurring Rules
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automate routine income and fixed subscription debits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleProcessDue}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Process Due</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Active Subscriptions & Rules
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.activeCount}</h3>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Estimated Monthly Recurring Inflow
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              +{formatCurrency(metrics.monthlyIncome, settings.currency)}
            </h3>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Estimated Monthly Fixed Debits
          </p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              -{formatCurrency(metrics.monthlyExpense, settings.currency)}
            </h3>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring rules scheduled"
          description="Set up recurring rules for monthly salaries, subscriptions (Netflix, Spotify), rent, or gym memberships to automate tracking."
          actionText="Create First Rule"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {rules.map((rule) => {
            const cat = getCategory(rule.template.categoryId);
            const isIncome = rule.template.type === 'income';
            const nextScheduled = computeNextScheduledDate(rule);

            return (
              <div
                key={rule.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-lg space-y-4 ${
                  rule.isActive
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 border"
                      style={{
                        backgroundColor: `${cat.color}18`,
                        borderColor: `${cat.color}35`,
                        color: cat.color,
                      }}
                    >
                      <IconRenderer name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{rule.template.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="capitalize font-semibold text-emerald-400">{rule.frequency}</span>
                        <span>•</span>
                        <span>{cat.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(rule.template.amount, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Due Date</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {formatDateString(nextScheduled, 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Started On</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {formatDateString(rule.startDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleRuleActive(rule.id, !rule.isActive)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      rule.isActive
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {rule.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {rule.isActive ? 'Pause Rule' : 'Resume Rule'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(rule.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modals */}
      <RecurringRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <RecurringRuleModal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        initialData={editingRule}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Recurring Rule"
        message="Are you sure you want to delete this recurring rule? Existing past transactions generated by this rule will remain intact."
        confirmText="Delete Rule"
        variant="danger"
      />
    </div>
  );
};
