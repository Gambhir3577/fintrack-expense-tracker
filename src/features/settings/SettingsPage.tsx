import React, { useState, useRef } from 'react';
import {
  Settings,
  DollarSign,
  Sun,
  Moon,
  Download,
  UploadCloud,
  Trash2,
  Sparkles,
  Database,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  Globe2,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { SupportedCurrency } from '../../types';
import { exportTransactionsToCSV, exportFullBackupJSON, restoreBackupFromJSON } from '../../utils/exportImport';
import { loadDemoData } from '../../db/seedData';
import { db } from '../../db';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';
import confetti from 'canvas-confetti';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings, setTheme, showToast } = useSettingsStore();
  const { transactions, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { loadBudgets } = useBudgetStore();
  const { loadRules } = useRecurringStore();
  const {
    baseCurrency,
    setBaseCurrency,
    rates,
    timestamp,
    source,
    isFallback,
    isLoading: isRatesLoading,
    refreshRates,
  } = useCurrencyStore();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, categories);
    showToast('Transactions exported to CSV', 'success');
  };

  const handleExportJSON = async () => {
    try {
      await exportFullBackupJSON();
      showToast('Full JSON backup downloaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export backup', 'error');
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await restoreBackupFromJSON(text);
      if (result.success) {
        await Promise.all([
          loadTransactions(),
          loadCategories(),
          loadBudgets(),
          loadRules(),
        ]);
        confetti({ particleCount: 50, spread: 60 });
        showToast('Database successfully restored from backup!', 'success');
      } else {
        showToast(result.message || 'Invalid backup file structure', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to restore backup', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    try {
      await loadDemoData();
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadBudgets(),
        loadRules(),
      ]);
      confetti({ particleCount: 60, spread: 70 });
      showToast('Sample dataset loaded successfully!', 'success');
      setIsDemoConfirmOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to load demo data', 'error');
    }
  };

  const handleClearDatabase = async () => {
    try {
      await Promise.all([
        db.transactions.clear(),
        db.budgets.clear(),
        db.recurringRules.clear(),
      ]);
      await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadRules(),
      ]);
      showToast('All transaction & budget data cleared', 'info');
      setIsResetConfirmOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to clear database', 'error');
    }
  };

  const updatedTimeAgo = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : 'Never';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize currency conversions, display themes, and local database backups
        </p>
      </div>

      {/* App Preferences */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          General Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Live Currency Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Display Currency
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFallback ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-400">
                  {isRatesLoading ? 'Fetching...' : isFallback ? 'Cached' : 'Live FX'}
                </span>
              </div>
            </div>

            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value as SupportedCurrency)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {Object.values(CURRENCY_CONFIGS).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name} — {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>

            {/* Exchange Rate Status & Refresh */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="text-slate-400 space-y-0.5 min-w-0 pr-2">
                <p className="text-[11px] truncate">
                  Rates: <span className="text-slate-200 font-medium">{updatedTimeAgo}</span>
                </p>
                {source && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Source: {source}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => refreshRates(true)}
                disabled={isRatesLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all shrink-0 border border-emerald-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRatesLoading ? 'animate-spin' : ''}`} />
                <span>{isRatesLoading ? 'Refreshing' : 'Refresh Rates'}</span>
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize flex items-center justify-center gap-1.5 border transition-all ${
                    settings.theme === t
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                  {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                  {t === 'system' && <Settings className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Rates Cheat Sheet Preview */}
        {Object.keys(rates).length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Conversion Table (1 {baseCurrency} =)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {Object.entries(CURRENCY_CONFIGS)
                .filter(([code]) => code !== baseCurrency)
                .map(([code, cfg]) => {
                  const rate = rates[code];
                  return (
                    <div
                      key={code}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-300">{cfg.code}</span>
                      <span className="font-mono text-emerald-400">
                        {rate ? (rate >= 100 ? rate.toFixed(1) : rate.toFixed(3)) : '—'} {cfg.symbol}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Data Management & Backups */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Data Backup & Export
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export CSV */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Export CSV Spreadsheet
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Download a clean CSV of all recorded transactions for spreadsheet analysis in Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>

          {/* Export JSON Full Backup */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                Export Full JSON Archive
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Creates a full encrypted snapshot of your transactions, categories, budgets, and recurring rules.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON Backup
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-purple-400" />
                Restore from JSON Backup
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Restore your previous database snapshot from a JSON file.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Select File to Restore
            </button>
          </div>

          {/* Load Sample Dataset */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Demo Dataset
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Populate 90 days of realistic history, paychecks, recurring bills, and budget targets.
              </p>
            </div>
            <button
              onClick={() => setIsDemoConfirmOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Load 90-Day Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-rose-950/20 border border-rose-900/40 p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Danger Zone
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-rose-900/30">
          <div>
            <p className="text-sm font-bold text-white">Wipe All Local Financial Records</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently deletes all transactions, budgets, and recurring rules from IndexedDB.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Reset Database
          </button>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Entire Database?"
        message="This action cannot be undone. All your locally recorded transactions, custom categories, budgets, and recurrence rules will be permanently erased."
        confirmText="Yes, Wipe Database"
        variant="danger"
        onConfirm={handleClearDatabase}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Confirm Demo Data Dialog */}
      <ConfirmDialog
        isOpen={isDemoConfirmOpen}
        title="Load Demo Financial History?"
        message="This will overwrite current records with 90 days of realistic sample transactions, monthly salaries, subscriptions, and budget goals."
        confirmText="Load Demo Data"
        variant="info"
        onConfirm={handleLoadDemo}
        onClose={() => setIsDemoConfirmOpen(false)}
      />
    </div>
  );
};
