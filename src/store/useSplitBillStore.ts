import { create } from 'zustand';
import { SplitGroup, SplitMember, SplitDetail, SupportedCurrency } from '../types';
import { db } from '../db';
import confetti from 'canvas-confetti';

export interface SettlementDebt {
  from: SplitMember;
  to: SplitMember;
  amount: number;
  upiLink?: string;
}

interface SplitBillState {
  groups: SplitGroup[];
  isLoading: boolean;

  loadGroups: () => Promise<void>;
  addGroup: (groupData: Omit<SplitGroup, 'id' | 'createdAt' | 'updatedAt' | 'settled'>) => Promise<SplitGroup>;
  updateGroup: (id: string, updates: Partial<SplitGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  toggleSettle: (id: string, settled: boolean) => Promise<void>;
  calculateSettlements: (group: SplitGroup) => SettlementDebt[];
}

const DEFAULT_SPLIT_GROUPS: SplitGroup[] = [
  {
    id: 'split-1',
    title: 'Weekend Goa Trip Villa & Food',
    totalAmount: 18000,
    currency: 'INR',
    paidByMemberId: 'mem-1',
    members: [
      { id: 'mem-1', name: 'Gambhir (You)', upiId: 'gambhir@paytm' },
      { id: 'mem-2', name: 'Alex Morgan', upiId: 'alex.m@okhdfcbank' },
      { id: 'mem-3', name: 'Rahul Sharma', upiId: 'rahul.s@oksbi' },
      { id: 'mem-4', name: 'Priya Patel', upiId: 'priya@icici' },
    ],
    splits: [
      { memberId: 'mem-1', amount: 4500, percentage: 25 },
      { memberId: 'mem-2', amount: 4500, percentage: 25 },
      { memberId: 'mem-3', amount: 4500, percentage: 25 },
      { memberId: 'mem-4', amount: 4500, percentage: 25 },
    ],
    settled: false,
    date: '2026-08-16',
    notes: 'Villa stay 2 nights + BBQ dinner',
    createdAt: '2026-08-16T00:00:00Z',
    updatedAt: '2026-08-16T00:00:00Z',
  },
  {
    id: 'split-2',
    title: 'Team Dinner at Barbeque Nation',
    totalAmount: 4800,
    currency: 'INR',
    paidByMemberId: 'mem-2',
    members: [
      { id: 'mem-1', name: 'Gambhir (You)', upiId: 'gambhir@paytm' },
      { id: 'mem-2', name: 'Alex Morgan', upiId: 'alex.m@okhdfcbank' },
      { id: 'mem-3', name: 'Sarah Jenkins' },
    ],
    splits: [
      { memberId: 'mem-1', amount: 1600, percentage: 33.33 },
      { memberId: 'mem-2', amount: 1600, percentage: 33.33 },
      { memberId: 'mem-3', amount: 1600, percentage: 33.33 },
    ],
    settled: true,
    date: '2026-08-10',
    notes: 'Buffet + Drinks',
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
];

export const useSplitBillStore = create<SplitBillState>((set, get) => ({
  groups: [],
  isLoading: false,

  loadGroups: async () => {
    set({ isLoading: true });
    try {
      let allGroups = await db.splitGroups.toArray();
      if (allGroups.length === 0) {
        await db.splitGroups.bulkAdd(DEFAULT_SPLIT_GROUPS);
        allGroups = DEFAULT_SPLIT_GROUPS;
      }
      set({ groups: allGroups, isLoading: false });
    } catch (err) {
      console.error('Failed to load split groups:', err);
      set({ groups: DEFAULT_SPLIT_GROUPS, isLoading: false });
    }
  },

  addGroup: async (groupData) => {
    const now = new Date().toISOString();
    const newGroup: SplitGroup = {
      ...groupData,
      id: `split-${Date.now()}`,
      settled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.splitGroups.put(newGroup);
    set((state) => ({ groups: [newGroup, ...state.groups] }));
    return newGroup;
  },

  updateGroup: async (id, updates) => {
    const now = new Date().toISOString();
    const current = get().groups.find((g) => g.id === id);
    if (!current) return;

    const updated: SplitGroup = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    await db.splitGroups.put(updated);
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGroup: async (id) => {
    await db.splitGroups.delete(id);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    }));
  },

  toggleSettle: async (id, settled) => {
    await get().updateGroup(id, { settled });
    if (settled) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.7 },
      });
    }
  },

  calculateSettlements: (group: SplitGroup): SettlementDebt[] => {
    const paidBy = group.members.find((m) => m.id === group.paidByMemberId);
    if (!paidBy) return [];

    const debts: SettlementDebt[] = [];

    group.splits.forEach((split) => {
      // If someone else owes the payer
      if (split.memberId !== group.paidByMemberId && split.amount > 0) {
        const fromMember = group.members.find((m) => m.id === split.memberId);
        if (fromMember) {
          let upiLink: string | undefined;
          if (paidBy.upiId) {
            upiLink = `upi://pay?pa=${encodeURIComponent(paidBy.upiId)}&pn=${encodeURIComponent(
              paidBy.name
            )}&am=${split.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(group.title)}`;
          }

          debts.push({
            from: fromMember,
            to: paidBy,
            amount: split.amount,
            upiLink,
          });
        }
      }
    });

    return debts;
  },
}));
