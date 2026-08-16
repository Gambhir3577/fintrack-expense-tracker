import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Toast } from '../common/Toast';
import { TransactionFormModal } from '../../features/transactions/TransactionFormModal';
import { initializeDatabase } from '../../db';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { AIFloatingButton } from '../ai/AIFloatingButton';
import { AIChatDrawer } from '../ai/AIChatDrawer';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { loadTransactions } = useTransactionStore();
  const { loadCategories } = useCategoryStore();
  const { loadBudgets } = useBudgetStore();
  const { loadRules, processRecurringRules } = useRecurringStore();
  const { loadSettings, showToast } = useSettingsStore();
  const { loadAuth } = useAuthStore();
  const { initCurrency, isFallback, error, refreshRates, isLoading: isCurrencyLoading } = useCurrencyStore();

  useEffect(() => {
    async function init() {
      try {
        loadAuth();
        await initializeDatabase();
        await Promise.all([
          loadSettings(),
          loadCategories(),
          loadTransactions(),
          loadBudgets(),
          loadRules(),
          initCurrency(),
        ]);

        // Auto-run recurring engine
        const generatedCount = await processRecurringRules();
        if (generatedCount > 0) {
          showToast(`Generated ${generatedCount} recurring transaction${generatedCount > 1 ? 's' : ''}!`, 'info');
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  return (
    <div className="min-h-screen aurora-bg text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden">
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Non-blocking Exchange Rate Warning / Offline Banner */}
      {isFallback && error && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => refreshRates(true)}
            disabled={isCurrencyLoading}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isCurrencyLoading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {isInitialized ? (
            <Outlet />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          )}
        </main>
      </div>

      <Toast />

      {/* Global AI Copilot Button & Slide-over Drawer */}
      <AIFloatingButton />
      <AIChatDrawer />

      {/* Global Add Transaction Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
