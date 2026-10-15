import { db } from '../db';
import { api, getAccessToken } from './api';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { useRecurringStore } from '../store/useRecurringStore';
import { useSavingsGoalStore } from '../store/useSavingsGoalStore';
import { useSplitBillStore } from '../store/useSplitBillStore';
import { useSettingsStore } from '../store/useSettingsStore';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

const STORAGE_KEY_LAST_SYNC = 'fintrack_last_sync_time';
const STORAGE_KEY_SYNC_ENABLED = 'fintrack_cloud_sync_enabled';

class SyncManager {
  private status: SyncStatus = 'idle';
  private lastSyncedAt: string | null =
    typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem(STORAGE_KEY_LAST_SYNC)
      : null;
  private isEnabled: boolean =
    typeof window !== 'undefined' && window.localStorage
      ? localStorage.getItem(STORAGE_KEY_SYNC_ENABLED) === 'true'
      : false;
  private listeners: Set<(status: SyncStatus, lastSyncedAt: string | null) => void> = new Set();
  private debounceTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.isEnabled && getAccessToken()) {
          this.fullSync();
        } else {
          this.updateStatus('idle');
        }
      });

      window.addEventListener('offline', () => {
        this.updateStatus('offline');
      });
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  public isSyncEnabled(): boolean {
    return this.isEnabled;
  }

  public subscribe(cb: (status: SyncStatus, lastSyncedAt: string | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.status, this.lastSyncedAt);
    return () => this.listeners.delete(cb);
  }

  private updateStatus(newStatus: SyncStatus): void {
    this.status = newStatus;
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.status, this.lastSyncedAt));
  }

  public setCloudSyncEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_SYNC_ENABLED, enabled ? 'true' : 'false');
    }
    if (enabled && getAccessToken()) {
      this.fullSync();
    } else {
      this.updateStatus('idle');
    }
  }

  public scheduleSync(delayMs = 2000): void {
    if (!this.isEnabled || !getAccessToken()) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.fullSync();
    }, delayMs);
  }

  public async fullSync(): Promise<void> {
    if (!navigator.onLine) {
      this.updateStatus('offline');
      return;
    }

    const token = getAccessToken();
    if (!token || !this.isEnabled) {
      this.updateStatus('idle');
      return;
    }

    this.updateStatus('syncing');

    try {
      // 1. Pull changes from cloud
      const pullResponse = await api.sync.pull(this.lastSyncedAt || undefined);
      const changes = pullResponse.changes;

      // Apply pulled changes into local Dexie
      if (changes.transactions && changes.transactions.length > 0) {
        for (const t of changes.transactions) {
          if (t.deletedAt) {
            await db.transactions.delete(t.id);
          } else {
            await db.transactions.put({
              id: t.id,
              date: t.date,
              description: t.description,
              amount: t.amount,
              type: t.type,
              categoryId: t.categoryId,
              isRecurring: t.isRecurring,
              recurringRuleId: t.recurringRuleId || undefined,
              notes: t.notes || undefined,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
            });
          }
        }
        await useTransactionStore.getState().loadTransactions();
      }

      if (changes.categories && changes.categories.length > 0) {
        for (const c of changes.categories) {
          if (c.deletedAt) {
            await db.categories.delete(c.id);
          } else {
            await db.categories.put({
              id: c.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
              type: c.type,
              budgetLimit: c.budgetLimit,
              isDefault: c.isDefault,
            });
          }
        }
        await useCategoryStore.getState().loadCategories();
      }

      if (changes.budgets && changes.budgets.length > 0) {
        for (const b of changes.budgets) {
          if (b.deletedAt) {
            await db.budgets.delete(b.id);
          } else {
            await db.budgets.put({
              id: b.id,
              categoryId: b.categoryId,
              monthlyLimit: b.monthlyLimit,
              period: b.period,
              notifyThreshold: b.notifyThreshold || 0.8,
            });
          }
        }
        await useBudgetStore.getState().loadBudgets();
      }

      if (changes.recurringRules && changes.recurringRules.length > 0) {
        for (const r of changes.recurringRules) {
          if (r.deletedAt) {
            await db.recurringRules.delete(r.id);
          } else {
            await db.recurringRules.put({
              id: r.id,
              frequency: r.frequency,
              startDate: r.startDate,
              endDate: r.endDate || undefined,
              lastGeneratedDate: r.lastGeneratedDate || undefined,
              isActive: r.isActive,
              template: r.template,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            });
          }
        }
        await useRecurringStore.getState().loadRules();
      }

      if (changes.savingsGoals && changes.savingsGoals.length > 0) {
        for (const g of changes.savingsGoals) {
          if (g.deletedAt) {
            await db.savingsGoals.delete(g.id);
          } else {
            await db.savingsGoals.put({
              id: g.id,
              title: g.title,
              targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              targetDate: g.targetDate,
              icon: g.icon,
              color: g.color,
              categoryId: g.categoryId || undefined,
              isCompleted: g.isCompleted,
              notes: g.notes || undefined,
              createdAt: g.createdAt,
              updatedAt: g.updatedAt,
            });
          }
        }
        await useSavingsGoalStore.getState().loadGoals();
      }

      if (changes.splitGroups && changes.splitGroups.length > 0) {
        for (const s of changes.splitGroups) {
          if (s.deletedAt) {
            await db.splitGroups.delete(s.id);
          } else {
            await db.splitGroups.put({
              id: s.id,
              title: s.title,
              totalAmount: s.totalAmount,
              currency: s.currency || 'INR',
              paidByMemberId: s.paidByMemberId,
              members: s.members,
              splits: s.splits,
              settled: s.settled,
              date: s.date,
              notes: s.notes || undefined,
              categoryId: s.categoryId || undefined,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            });
          }
        }
        await useSplitBillStore.getState().loadGroups();
      }

      if (changes.settings) {
        await db.settings.put({
          id: 'app-settings',
          currency: changes.settings.currency || 'INR',
          theme: changes.settings.theme || 'dark',
          dateFormat: changes.settings.dateFormat || 'YYYY-MM-DD',
          firstDayOfWeek: changes.settings.firstDayOfWeek ?? 1,
          hasCompletedOnboarding: changes.settings.hasCompletedOnboarding ?? true,
        });
        await useSettingsStore.getState().loadSettings();
      }

      // 2. Gather local changes to push to cloud
      const [
        localTransactions,
        localCategories,
        localBudgets,
        localRecurringRules,
        localSavingsGoals,
        localSplitGroups,
        localSettings,
      ] = await Promise.all([
        db.transactions.toArray(),
        db.categories.toArray(),
        db.budgets.toArray(),
        db.recurringRules.toArray(),
        db.savingsGoals.toArray(),
        db.splitGroups.toArray(),
        db.settings.get('app-settings'),
      ]);

      const pushPayload = {
        transactions: localTransactions.map((t) => ({
          ...t,
          updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
        })),
        categories: localCategories.map((c) => ({
          ...c,
          updatedAt: new Date().toISOString(),
        })),
        budgets: localBudgets.map((b) => ({
          ...b,
          updatedAt: new Date().toISOString(),
        })),
        recurringRules: localRecurringRules.map((r) => ({
          ...r,
          updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
        })),
        savingsGoals: localSavingsGoals.map((g) => ({
          ...g,
          updatedAt: g.updatedAt || g.createdAt || new Date().toISOString(),
        })),
        splitGroups: localSplitGroups.map((s) => ({
          ...s,
          updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
        })),
        settings: localSettings
          ? {
              currency: localSettings.currency,
              theme: localSettings.theme,
              dateFormat: localSettings.dateFormat,
              firstDayOfWeek: localSettings.firstDayOfWeek,
              hasCompletedOnboarding: localSettings.hasCompletedOnboarding,
              updatedAt: new Date().toISOString(),
            }
          : undefined,
      };

      await api.sync.push(pushPayload);

      // Record successful sync time
      this.lastSyncedAt = pullResponse.timestamp || new Date().toISOString();
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, this.lastSyncedAt);
      }
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Sync failed:', err);
      if (!navigator.onLine) {
        this.updateStatus('offline');
      } else {
        this.updateStatus('error');
      }
    }
  }
}

export const syncManager = new SyncManager();
