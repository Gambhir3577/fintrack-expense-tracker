import { create } from 'zustand';
import { Transaction, TransactionType } from '../types';
import { db } from '../db';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, isWithinInterval } from 'date-fns';

export type DateRangePreset = 'all' | 'this-month' | 'last-month' | 'last-90-days' | 'this-year' | 'custom';

interface TransactionFilters {
  searchQuery: string;
  categoryId: string; // 'all' or category id
  type: 'all' | TransactionType;
  datePreset: DateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  recurringOnly: boolean;
}

interface SortConfig {
  field: 'date' | 'amount' | 'description' | 'categoryId' | 'createdAt';
  order: 'asc' | 'desc';
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  filters: TransactionFilters;
  sortConfig: SortConfig;
  currentPage: number;
  pageSize: number;

  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkAddTransactions: (txs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  setFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void;
  resetFilters: () => void;
  setSort: (field: SortConfig['field']) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getFilteredTransactions: () => Transaction[];
}

const initialFilters: TransactionFilters = {
  searchQuery: '',
  categoryId: 'all',
  type: 'all',
  datePreset: 'all',
  recurringOnly: false,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  filters: initialFilters,
  sortConfig: { field: 'date', order: 'desc' },
  currentPage: 1,
  pageSize: 15,

  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const all = await db.transactions.toArray();
      // Sort newest date first
      all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      set({ transactions: all, isLoading: false });
    } catch (error) {
      console.error('Failed to load transactions from IndexedDB:', error);
      set({ isLoading: false });
    }
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    await db.transactions.put(newTx);
    set((state) => ({
      transactions: [newTx, ...state.transactions].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      ),
    }));
    return newTx;
  },

  updateTransaction: async (tx) => {
    const updated: Transaction = {
      ...tx,
      updatedAt: new Date().toISOString(),
    };
    await db.transactions.put(updated);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === tx.id ? updated : t)),
    }));
  },

  deleteTransaction: async (id) => {
    await db.transactions.delete(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  bulkAddTransactions: async (txList) => {
    const now = new Date().toISOString();
    const newItems: Transaction[] = txList.map((t, idx) => ({
      ...t,
      id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    }));
    await db.transactions.bulkPut(newItems);
    await get().loadTransactions();
    return newItems.length;
  },

  bulkDeleteTransactions: async (ids) => {
    await db.transactions.bulkDelete(ids);
    set((state) => ({
      transactions: state.transactions.filter((t) => !ids.includes(t.id)),
    }));
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1, // reset page on filter change
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters, currentPage: 1 });
  },

  setSort: (field) => {
    set((state) => {
      const isSame = state.sortConfig.field === field;
      const order = isSame && state.sortConfig.order === 'asc' ? 'desc' : 'asc';
      return { sortConfig: { field, order } };
    });
  },

  setPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

  getFilteredTransactions: () => {
    const { transactions, filters, sortConfig } = get();
    const now = new Date();

    return transactions
      .filter((tx) => {
        // Search description and notes
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
          if (!matchDesc && !matchNotes) return false;
        }

        // Type filter
        if (filters.type !== 'all' && tx.type !== filters.type) {
          return false;
        }

        // Category filter
        if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) {
          return false;
        }

        // Recurring filter
        if (filters.recurringOnly && !tx.isRecurring) {
          return false;
        }

        // Date Presets
        if (filters.datePreset === 'this-month') {
          const curMonthPrefix = format(now, 'yyyy-MM');
          if (!tx.date.startsWith(curMonthPrefix)) return false;
        } else if (filters.datePreset === 'last-month') {
          const lastMonthPrefix = format(subMonths(now, 1), 'yyyy-MM');
          if (!tx.date.startsWith(lastMonthPrefix)) return false;
        } else if (filters.datePreset === 'this-year') {
          const curYearPrefix = format(now, 'yyyy');
          if (!tx.date.startsWith(curYearPrefix)) return false;
        } else if (filters.datePreset === 'custom') {
          if (filters.customStartDate && tx.date < filters.customStartDate) return false;
          if (filters.customEndDate && tx.date > filters.customEndDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const { field, order } = sortConfig;
        let comparison = 0;

        if (field === 'date') {
          comparison = a.date.localeCompare(b.date);
        } else if (field === 'amount') {
          comparison = a.amount - b.amount;
        } else if (field === 'description') {
          comparison = a.description.localeCompare(b.description);
        } else if (field === 'categoryId') {
          comparison = a.categoryId.localeCompare(b.categoryId);
        } else {
          comparison = a.createdAt.localeCompare(b.createdAt);
        }

        return order === 'asc' ? comparison : -comparison;
      });
  },
}));
