import { create } from 'zustand';
import { SavingsGoal } from '../types';
import { db } from '../db';
import confetti from 'canvas-confetti';

interface SavingsGoalState {
  goals: SavingsGoal[];
  isLoading: boolean;

  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => Promise<SavingsGoal>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, deltaAmount: number) => Promise<{ isCompletedNow: boolean }>;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'goal-emergency',
    title: 'Emergency Reserve Fund',
    targetAmount: 150000,
    currentAmount: 95000,
    targetDate: '2026-12-31',
    icon: 'ShieldCheck',
    color: '#10B981',
    isCompleted: false,
    notes: '6 months of core living expenses',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'goal-macbook',
    title: 'MacBook Pro M3 Max',
    targetAmount: 199000,
    currentAmount: 140000,
    targetDate: '2026-10-15',
    icon: 'Laptop',
    color: '#06B6D4',
    isCompleted: false,
    notes: 'New development workstation',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'goal-vacation',
    title: 'Goa Holiday Trip',
    targetAmount: 45000,
    currentAmount: 45000,
    targetDate: '2026-08-25',
    icon: 'Palmtree',
    color: '#F59E0B',
    isCompleted: true,
    notes: 'Flight tickets and resort booking',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

export const useSavingsGoalStore = create<SavingsGoalState>((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      let allGoals = await db.savingsGoals.toArray();
      if (allGoals.length === 0) {
        await db.savingsGoals.bulkAdd(DEFAULT_GOALS);
        allGoals = DEFAULT_GOALS;
      }
      set({ goals: allGoals, isLoading: false });
    } catch (err) {
      console.error('Failed to load savings goals:', err);
      set({ goals: DEFAULT_GOALS, isLoading: false });
    }
  },

  addGoal: async (goalData) => {
    const now = new Date().toISOString();
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      isCompleted: goalData.currentAmount >= goalData.targetAmount,
      createdAt: now,
      updatedAt: now,
    };

    await db.savingsGoals.put(newGoal);
    set((state) => ({ goals: [newGoal, ...state.goals] }));
    return newGoal;
  },

  updateGoal: async (id, updates) => {
    const now = new Date().toISOString();
    const current = get().goals.find((g) => g.id === id);
    if (!current) return;

    const updated: SavingsGoal = {
      ...current,
      ...updates,
      updatedAt: now,
      isCompleted:
        updates.currentAmount !== undefined
          ? updates.currentAmount >= (updates.targetAmount || current.targetAmount)
          : current.isCompleted,
    };

    await db.savingsGoals.put(updated);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updated : g)),
    }));
  },

  deleteGoal: async (id) => {
    await db.savingsGoals.delete(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  contributeToGoal: async (id, deltaAmount) => {
    const current = get().goals.find((g) => g.id === id);
    if (!current) return { isCompletedNow: false };

    const newAmount = Math.max(0, current.currentAmount + deltaAmount);
    const wasCompleted = current.isCompleted;
    const isCompletedNow = newAmount >= current.targetAmount;

    await get().updateGoal(id, { currentAmount: newAmount, isCompleted: isCompletedNow });

    if (!wasCompleted && isCompletedNow) {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B'],
      });
    }

    return { isCompletedNow };
  },
}));
