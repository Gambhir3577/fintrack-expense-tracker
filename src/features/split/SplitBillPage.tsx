import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  QrCode,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useSplitBillStore } from '../../store/useSplitBillStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { SplitGroup } from '../../types';
import { formatCurrency, formatDateString } from '../../utils/formatters';
import { SplitBillModal } from './SplitBillModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SplitBillPage: React.FC = () => {
  const { groups, loadGroups, deleteGroup, toggleSettle, calculateSettlements } = useSplitBillStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SplitGroup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedUpiId, setCopiedUpiId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const stats = useMemo(() => {
    let totalTracked = 0;
    let settledCount = 0;
    groups.forEach((g) => {
      totalTracked += g.totalAmount;
      if (g.settled) settledCount++;
    });

    return {
      totalGroups: groups.length,
      totalTracked,
      settledCount,
      activeCount: groups.length - settledCount,
    };
  }, [groups]);

  const handleCopyUPI = (upiLink: string, identifier: string) => {
    navigator.clipboard.writeText(upiLink);
    setCopiedUpiId(identifier);
    showToast('UPI Payment Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedUpiId(null), 2500);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteGroup(deletingId);
      showToast('Group bill deleted', 'info');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete bill', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Users className="w-5 h-5 stroke-[2.3]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Split the Bill & Group Expenses
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Split restaurant bills, trip stays, and team outings with friends and generate UPI payment links
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Split New Bill</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Group Spending</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {formatCurrency(stats.totalTracked, baseCurrency)}
          </h3>
          <p className="text-xs text-slate-400">Across {stats.totalGroups} shared expenses</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Unsettled Bills</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-400">{stats.activeCount}</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Pending
            </span>
          </div>
          <p className="text-xs text-slate-400">Awaiting member settlements</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Settled Bills</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.settledCount}</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400">100% paid and cleared</p>
        </div>

      </div>

      {/* Group Bills List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const payer = group.members.find((m) => m.id === group.paidByMemberId) || group.members[0];
          const settlements = calculateSettlements(group);

          return (
            <div
              key={group.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xl space-y-5 flex flex-col justify-between ${
                group.settled
                  ? 'bg-slate-950/70 border-slate-800/70 opacity-75'
                  : 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                        {group.title}
                      </h3>
                      {group.settled ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Paid by <strong className="text-emerald-400">{payer?.name}</strong> •{' '}
                      {formatDateString(group.date, 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xl font-mono font-extrabold text-white">
                      {formatCurrency(group.totalAmount, baseCurrency)}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Group"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(group.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Members Split Breakdown */}
                <div className="space-y-2 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    Individual Shares ({group.members.length} people)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {group.splits.map((split) => {
                      const m = group.members.find((mem) => mem.id === split.memberId);
                      const isPayer = split.memberId === group.paidByMemberId;
                      return (
                        <div
                          key={split.memberId}
                          className={`p-2.5 rounded-xl border text-xs ${
                            isPayer
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="truncate font-bold text-white">{m?.name}</div>
                          <div className="font-mono mt-0.5">{formatCurrency(split.amount, baseCurrency)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settlement Debts & UPI Links */}
                {!group.settled && settlements.length > 0 && (
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80 mt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      Settlement Actions & UPI
                    </span>

                    <div className="space-y-2">
                      {settlements.map((debt, idx) => {
                        const debtId = `${group.id}-${idx}`;
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-200">{debt.from.name}</span> owes{' '}
                              <span className="font-bold text-emerald-400">{debt.to.name}</span>:{' '}
                              <strong className="font-mono text-white text-sm">
                                {formatCurrency(debt.amount, baseCurrency)}
                              </strong>
                              {debt.to.upiId && (
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  UPI: {debt.to.upiId}
                                </p>
                              )}
                            </div>

                            {debt.upiLink && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={debt.upiLink}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <span>Pay UPI</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleCopyUPI(debt.upiLink!, debtId)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                                  title="Copy UPI Link"
                                >
                                  {copiedUpiId === debtId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Settle Toggle Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => toggleSettle(group.id, !group.settled)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                    group.settled
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{group.settled ? 'Mark as Unsettled' : 'Mark All Debts as Settled'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modals */}
      <SplitBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <SplitBillModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        initialData={editingGroup}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Shared Bill"
        message="Are you sure you want to delete this group expense?"
        confirmText="Delete"
        variant="danger"
      />

    </div>
  );
};
