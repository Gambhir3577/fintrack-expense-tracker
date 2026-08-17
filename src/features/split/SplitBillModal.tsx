import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { SplitGroup, SplitMember, SplitDetail } from '../../types';
import { useSplitBillStore } from '../../store/useSplitBillStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { Users, Plus, Trash2, DollarSign, Calendar, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SplitGroup | null;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addGroup, updateGroup } = useSplitBillStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [paidByMemberId, setPaidByMemberId] = useState('mem-1');

  // Members list
  const [members, setMembers] = useState<SplitMember[]>([
    { id: 'mem-1', name: 'You', upiId: '' },
    { id: 'mem-2', name: 'Friend 1', upiId: '' },
  ]);

  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setTotalAmount(initialData.totalAmount.toString());
        setDate(initialData.date);
        setNotes(initialData.notes || '');
        setPaidByMemberId(initialData.paidByMemberId);
        setMembers(initialData.members);

        const customMap: Record<string, string> = {};
        initialData.splits.forEach((s) => {
          customMap[s.memberId] = s.amount.toString();
        });
        setCustomAmounts(customMap);
      } else {
        setTitle('');
        setTotalAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setNotes('');
        setMembers([
          { id: `mem-${Date.now()}-1`, name: 'You', upiId: '' },
          { id: `mem-${Date.now()}-2`, name: 'Friend 1', upiId: '' },
        ]);
        setPaidByMemberId('');
        setCustomAmounts({});
        setSplitMode('equal');
      }
    }
  }, [isOpen, initialData]);

  // Set default paidBy
  useEffect(() => {
    if (members.length > 0 && !paidByMemberId) {
      setPaidByMemberId(members[0].id);
    }
  }, [members, paidByMemberId]);

  const handleAddMember = () => {
    const newMember: SplitMember = {
      id: `mem-${Date.now()}-${members.length + 1}`,
      name: `Person ${members.length + 1}`,
      upiId: '',
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 2) {
      showToast('Minimum 2 members required to split', 'error');
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
    if (paidByMemberId === id) {
      setPaidByMemberId(members[0]?.id || '');
    }
  };

  const handleUpdateMember = (id: string, field: 'name' | 'upiId', val: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(totalAmount);
    if (!title.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid bill amount', 'error');
      return;
    }
    if (members.length < 2) {
      showToast('Please add at least 2 people to split with', 'error');
      return;
    }

    // Compute splits
    let splits: SplitDetail[] = [];
    if (splitMode === 'equal') {
      const splitAmount = Math.round((amountNum / members.length) * 100) / 100;
      splits = members.map((m) => ({
        memberId: m.id,
        amount: splitAmount,
        percentage: 100 / members.length,
      }));
    } else {
      splits = members.map((m) => ({
        memberId: m.id,
        amount: parseFloat(customAmounts[m.id]) || 0,
      }));
    }

    try {
      if (initialData) {
        await updateGroup(initialData.id, {
          title: title.trim(),
          totalAmount: amountNum,
          currency: baseCurrency,
          paidByMemberId,
          members,
          splits,
          date,
          notes: notes.trim() || undefined,
        });
        showToast('Group bill split updated!', 'success');
      } else {
        await addGroup({
          title: title.trim(),
          totalAmount: amountNum,
          currency: baseCurrency,
          paidByMemberId,
          members,
          splits,
          date,
          notes: notes.trim() || undefined,
        });
        showToast('New group bill created and split!', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save split bill', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Group Bill' : 'Split New Group Expense'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Bill Title & Total Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Expense / Trip Title
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Villa & Food, Friday Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Total Bill Amount ({baseCurrency})
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="any"
                placeholder="4500"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-base font-bold text-white font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Date & Who Paid Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Who Paid The Entire Bill?
            </label>
            <select
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-950 text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Members & UPI Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              Group Members ({members.length})
            </label>
            <button
              type="button"
              onClick={handleAddMember}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Person</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                    placeholder="Name"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="relative">
                    <QrCode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={member.upiId || ''}
                      onChange={(e) => handleUpdateMember(member.id, 'upiId', e.target.value)}
                      placeholder="UPI ID (e.g. name@okhdfcbank)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md active:scale-95 transition-all"
          >
            {initialData ? 'Save Split Changes' : 'Calculate & Split Bill'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
