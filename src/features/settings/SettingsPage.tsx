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
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { SupportedCurrency } from '../../types';
import { exportTransactionsToCSV, exportFullBackupJSON, restoreBackupFromJSON } from '../../utils/exportImport';
import { loadDemoData } from '../../db/seedData';
import { db } from '../../db';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import confetti from 'canvas-confetti';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings, setCurrency, setTheme, showToast } = useSettingsStore();
  const { transactions, loadTransactions } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();
  const { loadBudgets } = useBudgetStore();
  const { loadRules } = useRecurringStore();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, categories);
    showToast(`Exported ${transactions.length} transactions to CSV`, 'success');
  };

  const handleExportJSON = async () => {
    try {
      await exportFullBackupJSON();
      showToast('Downloaded full backup JSON archive', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export backup JSON', 'error');
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
        showToast(result.message, 'success');
        confetti({ particleCount: 40, spread: 60 });
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error parsing backup file', 'error');
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
      showToast('Loaded 90 days of sample demo records!', 'success');
      confetti({ particleCount: 40, spread: 60 });
    } catch (err) {
      console.error(err);
      showToast('Failed to load demo dataset', 'error');
    }
  };

  const handleResetAllData = async () => {
    try {
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringRules.clear();
      await db.categories.clear();
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadBudgets(),
        loadRules(),
      ]);
      showToast('All transaction and budget data has been cleared', 'info');
      setIsResetConfirmOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to clear database', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize currency formatting, display themes, and local database backups
        </p>
      </div>

      {/* App Preferences */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          General Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Display Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {Object.values(CURRENCY_CONFIGS).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name} — {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
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
              className="w-full py-2 px-3 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Backup File
            </button>
          </div>

          {/* Demo Data Generator */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Demo Dataset
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Populate 90 days of realistic history, recurring rules, and budgets for showcase or testing.
              </p>
            </div>
            <button
              onClick={() => setIsDemoConfirmOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Demo Records
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 space-y-4 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Permanently delete all stored financial records and reset your local IndexedDB storage.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Financial Data</span>
        </button>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetAllData}
        title="Clear All Stored Data?"
        message="This will completely wipe all transactions, budgets, recurring rules, and custom categories from your browser's IndexedDB. This action cannot be reversed."
        confirmText="Yes, Wipe Database"
        variant="danger"
      />

      {/* Confirm Demo Load Dialog */}
      <ConfirmDialog
        isOpen={isDemoConfirmOpen}
        onClose={() => setIsDemoConfirmOpen(false)}
        onConfirm={handleLoadDemo}
        title="Load Demo Dataset?"
        message="This will overwrite current records with 90 days of sample transactions, recurring rules, and monthly budgets."
        confirmText="Load Demo Data"
        variant="warning"
      />
    </div>
  );
};
