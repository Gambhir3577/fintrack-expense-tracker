import React, { useState, useRef, useEffect } from 'react';
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
  User,
  Camera,
  Image as ImageIcon,
  Check,
  Shield,
  Calendar,
  Mail,
  Edit3,
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
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
import { formatDistanceToNow, format } from 'date-fns';
import confetti from 'canvas-confetti';

const PRESET_AVATARS = [
  {
    id: 'avatar-1',
    name: 'Alex Morgan',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-2',
    name: 'Sarah Jenkins',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-3',
    name: 'David Kumar',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-4',
    name: 'Priya Patel',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-5',
    name: 'Michael Scott',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-6',
    name: 'Elena Gomez',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUploadRef = useRef<HTMLInputElement>(null);

  const { settings, setTheme, showToast } = useSettingsStore();
  const { user, updateProfile } = useAuthStore();
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

  // Profile editing state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    updateProfile({ name: nameInput.trim() });
    setIsEditingName(false);
    showToast('Profile name updated successfully!', 'success');
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Please select an image smaller than 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProfile({ avatarUrl: reader.result });
        confetti({ particleCount: 30, spread: 50 });
        showToast('Profile photo updated!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url: string) => {
    updateProfile({ avatarUrl: url });
    showToast('Avatar updated from gallery!', 'success');
  };

  const handleRemoveAvatar = () => {
    updateProfile({ avatarUrl: '' });
    showToast('Custom photo removed', 'info');
  };

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
          Settings & Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal profile, currency conversions, display appearance, and local database backups
        </p>
      </div>

      {/* 👤 USER PROFILE SECTION */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        
        {/* Subtle glow header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Personal Profile & Avatar
          </h3>
          <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Local Account
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Avatar Preview & Upload Column */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="relative group">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User Avatar'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10 transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl font-extrabold shadow-xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Quick camera overlay button */}
              <button
                type="button"
                onClick={() => avatarUploadRef.current?.click()}
                title="Upload Photo"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg border-2 border-slate-900 transition-all hover:scale-110"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={avatarUploadRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileUpload}
              className="hidden"
            />

            <div>
              <p className="text-sm font-bold text-white truncate max-w-[200px]">
                {user?.name || 'FinTrack User'}
              </p>
              <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                {user?.email || 'user@local'}
              </p>
            </div>

            {/* Avatar action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => avatarUploadRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Custom</span>
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                  title="Remove avatar"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Profile Name & Preset Avatar Picker Column */}
          <div className="md:col-span-8 space-y-5">
            
            {/* Edit Name Form */}
            <form onSubmit={handleSaveName} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Display Name
              </label>
              <div className="flex items-center gap-2.5">
                <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Name</span>
                </button>
              </div>
            </form>

            {/* Curated Preset Avatar Gallery */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or Select from Avatar Gallery
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((avatar) => {
                  const isSelected = user?.avatarUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(avatar.url)}
                      className={`p-1 rounded-2xl border transition-all flex flex-col items-center group relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                      <span className="text-[10px] font-medium text-slate-400 mt-1 truncate w-full text-center group-hover:text-slate-200">
                        {avatar.name.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Meta Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{user?.email || 'user@local'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Member since {user?.joinedAt ? format(new Date(user.joinedAt), 'MMM yyyy') : 'Recent'}
                </span>
              </div>
            </div>

          </div>
        </div>
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  settings.theme === 'dark'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark Mode
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  settings.theme === 'light'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" /> Light Mode
              </button>
            </div>
          </div>
        </div>

        {/* Live FX Conversion Matrix Cheat Sheet */}
        {rates && Object.keys(rates).length > 0 && (
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live FX Conversion Matrix (1 {baseCurrency})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">Auto-updated</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(rates)
                .filter(([code]) => code !== baseCurrency)
                .slice(0, 10)
                .map(([code, rate]) => (
                  <div
                    key={code}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-400">{code}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {rate < 0.01 ? rate.toFixed(4) : rate < 1 ? rate.toFixed(3) : rate.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Export & Backup Management */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Data Management & Backups
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Export your database to CSV or restore from full JSON backups.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Export CSV Spreadsheet
                </p>
                <p className="text-xs text-slate-400">Readable table of all transactions</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  Export Full JSON Backup
                </p>
                <p className="text-xs text-slate-400">Complete database snapshot</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>
        </div>

        {/* Restore Section */}
        <div className="p-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UploadCloud className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Restore from JSON Backup</p>
              <p className="text-xs text-slate-400">Select a previously exported FinTrack backup file</p>
            </div>
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
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
          >
            Select Backup File
          </button>
        </div>
      </div>

      {/* Demo Data & Danger Zone */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Data Controls & Reset
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" /> Load Realistic Demo Dataset
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Populates 90 days of transactions, recurring payroll, subscriptions, and budget goals
            </p>
          </div>

          <button
            onClick={() => setIsDemoConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors shrink-0"
          >
            Load Demo Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div>
            <p className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Reset Local Database
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently delete all stored transactions, recurring rules, and budgets from IndexedDB
            </p>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            Wipe Database
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
