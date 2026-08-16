import { create } from 'zustand';
import { BudgetGoal } from '../types';
import { db } from '../db';
import { format } from 'date-fns';

interface BudgetState {
  budgets: BudgetGoal[];
  selectedPeriod: string; // 'YYYY-MM'
  isLoading: boolean;
  loadBudgets: () => Promise<void>;
  setSelectedPeriod: (period: string) => void;
  setBudgetGoal: (categoryId: string, monthlyLimit: number, period?: string) => Promise<void>;
  deleteBudgetGoal: (id: string) => Promise<void>;
  getBudgetForCategory: (categoryId: string, period?: string) => BudgetGoal | undefined;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  selectedPeriod: format(new Date(), 'yyyy-MM'),
  isLoading: false,

  loadBudgets: async () => {
    set({ isLoading: true });
    try {
      const allBudgets = await db.budgets.toArray();
      set({ budgets: allBudgets, isLoading: false });
    } catch (error) {
      console.error('Failed to load budget goals:', error);
      set({ isLoading: false });
    }
  },

  setSelectedPeriod: (period: string) => {
    set({ selectedPeriod: period });
  },

  setBudgetGoal: async (categoryId: string, monthlyLimit: number, period?: string) => {
    const targetPeriod = period || get().selectedPeriod;
    const existing = get().budgets.find(
      (b) => b.categoryId === categoryId && b.period === targetPeriod
    );

    const goal: BudgetGoal = {
      id: existing ? existing.id : `b-${targetPeriod}-${categoryId}`,
      categoryId,
      monthlyLimit,
      period: targetPeriod,
      notifyThreshold: 0.8,
    };

    await db.budgets.put(goal);
    set((state) => ({
      budgets: [
        ...state.budgets.filter((b) => !(b.categoryId === categoryId && b.period === targetPeriod)),
        goal,
      ],
    }));
  },

  deleteBudgetGoal: async (id: string) => {
    await db.budgets.delete(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  getBudgetForCategory: (categoryId: string, period?: string) => {
    const targetPeriod = period || get().selectedPeriod;
    return get().budgets.find(
      (b) => b.categoryId === categoryId && b.period === targetPeriod
    );
  },
}));
