import { create } from 'zustand';
import { RecurrenceRule, Transaction } from '../types';
import { db } from '../db';
import { generatePendingRecurringTransactions } from '../utils/recurringEngine';
import { useTransactionStore } from './useTransactionStore';

interface RecurringState {
  rules: RecurrenceRule[];
  isLoading: boolean;
  isProcessing: boolean;
  lastRunResult?: { generatedCount: number; timestamp: string };

  loadRules: () => Promise<void>;
  addRule: (ruleData: Omit<RecurrenceRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecurrenceRule>;
  updateRule: (rule: RecurrenceRule) => Promise<void>;
  toggleRuleActive: (id: string, isActive: boolean) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  processRecurringRules: () => Promise<number>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  rules: [],
  isLoading: false,
  isProcessing: false,

  loadRules: async () => {
    set({ isLoading: true });
    try {
      const allRules = await db.recurringRules.toArray();
      set({ rules: allRules, isLoading: false });
    } catch (error) {
      console.error('Failed to load recurring rules:', error);
      set({ isLoading: false });
    }
  },

  addRule: async (ruleData) => {
    const now = new Date().toISOString();
    const newRule: RecurrenceRule = {
      ...ruleData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };

    await db.recurringRules.put(newRule);
    set((state) => ({ rules: [...state.rules, newRule] }));

    // Automatically check if an initial transaction needs generating
    await get().processRecurringRules();

    return newRule;
  },

  updateRule: async (rule) => {
    const updated: RecurrenceRule = {
      ...rule,
      updatedAt: new Date().toISOString(),
    };
    await db.recurringRules.put(updated);
    set((state) => ({
      rules: state.rules.map((r) => (r.id === rule.id ? updated : r)),
    }));
  },

  toggleRuleActive: async (id: string, isActive: boolean) => {
    const rule = get().rules.find((r) => r.id === id);
    if (!rule) return;
    const updated: RecurrenceRule = {
      ...rule,
      isActive,
      updatedAt: new Date().toISOString(),
    };
    await db.recurringRules.put(updated);
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? updated : r)),
    }));
  },

  deleteRule: async (id: string) => {
    await db.recurringRules.delete(id);
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
    }));
  },

  processRecurringRules: async () => {
    const rules = await db.recurringRules.toArray();
    if (rules.length === 0) return 0;

    set({ isProcessing: true });
    const { newTransactions, updatedRules } = generatePendingRecurringTransactions(rules);

    if (newTransactions.length > 0) {
      await db.transactions.bulkPut(newTransactions);
      // Reload transaction store to reflect newly generated instances
      await useTransactionStore.getState().loadTransactions();
    }

    if (updatedRules.length > 0) {
      await db.recurringRules.bulkPut(updatedRules);
      const allRules = await db.recurringRules.toArray();
      set({ rules: allRules });
    }

    set({
      isProcessing: false,
      lastRunResult: {
        generatedCount: newTransactions.length,
        timestamp: new Date().toISOString(),
      },
    });

    return newTransactions.length;
  },
}));
