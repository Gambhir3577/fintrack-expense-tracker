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
  Bot,
  Zap,
  Key,
  Cloud,
  CloudOff,
  Wifi,
  Bell,
  BellRing,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { syncManager, SyncStatus } from '../../lib/syncManager';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { useAIStore } from '../../store/useAIStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { SupportedCurrency, NotificationPreferences } from '../../types';
import { requestNotificationPermission, sendNotification, syncScheduledNotifications } from '../../utils/nativeNotifications';
import { checkBiometricAvailability, authenticateWithBiometrics, isNative as isNativeDevice } from '../../utils/nativeBiometrics';
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

  const { settings, setTheme, showToast, updateSettings } = useSettingsStore();
  const { user, updateProfile, isCloudUser } = useAuthStore();
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
  const { keyConfig, setKeyConfig } = useAIStore();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(syncManager.getLastSyncedAt());
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState<boolean>(syncManager.isSyncEnabled());
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  useEffect(() => {
    return syncManager.subscribe((status, lastSynced) => {
      setSyncStatus(status);
      setLastSyncedTime(lastSynced);
      setIsCloudSyncEnabled(syncManager.isSyncEnabled());
    });
  }, []);

  const handleToggleCloudSync = (enabled: boolean) => {
    setIsCloudSyncEnabled(enabled);
    syncManager.setCloudSyncEnabled(enabled);
    showToast(enabled ? 'Cloud sync enabled' : 'Cloud sync paused', 'info');
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    await syncManager.fullSync();
    setIsSyncingNow(false);
    showToast('Synchronization completed', 'success');
  };

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

  const handleToggleNotifications = async (enable: boolean) => {
    if (enable) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast('Notification permission was not granted. Please enable notifications in device settings.', 'warning');
        return;
      }
      showToast('Notifications enabled!', 'success');
    }

    const currentPrefs = settings.notifications || {
      enabled: false,
      budgetAlerts: true,
      recurringReminders: true,
      dailyReminder: false,
      dailyReminderTime: '20:00',
    };

    const updated = {
      ...currentPrefs,
      enabled: enable,
    };

    await updateSettings({ notifications: updated });
    await syncScheduledNotifications(updated);
  };

  const handleUpdateNotificationSubPref = async (key: keyof NotificationPreferences, value: any) => {
    const currentPrefs = settings.notifications || {
      enabled: false,
      budgetAlerts: true,
      recurringReminders: true,
      dailyReminder: false,
      dailyReminderTime: '20:00',
    };

    const updated = {
      ...currentPrefs,
      [key]: value,
    };

    await updateSettings({ notifications: updated });
    await syncScheduledNotifications(updated);
  };

  const handleSendTestNotification = async () => {
    const success = await sendNotification(
      101,
      '🔔 FinTrack Alert Test',
      'This is a test notification from FinTrack AI. Your mobile alerts are working properly!',
      'fintrack_alerts'
    );
    if (success) {
      showToast('Test alert sent to device!', 'success');
    } else {
      showToast('Could not send notification. Please check notification permissions.', 'error');
    }
  };

  const [biometryInfo, setBiometryInfo] = useState<{ isAvailable: boolean; title: string }>({
    isAvailable: false,
    title: 'Checking hardware...',
  });

  useEffect(() => {
    checkBiometricAvailability().then((info) => {
      setBiometryInfo({ isAvailable: info.isAvailable, title: info.biometryTitle });
    });
  }, []);

  const handleToggleBiometricLock = async (enable: boolean) => {
    if (enable) {
      if (isNativeDevice) {
        const avail = await checkBiometricAvailability();
        if (!avail.isAvailable) {
          showToast('No enrolled biometrics (Fingerprint/Face) found on device.', 'warning');
          return;
        }

        const auth = await authenticateWithBiometrics('Verify fingerprint or face to enable App Lock');
        if (!auth.success) {
          showToast('Biometric verification cancelled or failed.', 'error');
          return;
        }
      }

      const currentSec = settings.security || { biometricLock: false, lockTimeoutMinutes: 0 };
      await updateSettings({ security: { ...currentSec, biometricLock: true } });
      showToast('Biometric App Lock enabled! Vault is now protected.', 'success');
    } else {
      if (isNativeDevice && settings.security?.biometricLock) {
        const auth = await authenticateWithBiometrics('Verify fingerprint or face to disable App Lock');
        if (!auth.success) {
          showToast('Verification required to disable App Lock.', 'error');
          return;
        }
      }

      const currentSec = settings.security || { biometricLock: false, lockTimeoutMinutes: 0 };
      await updateSettings({ security: { ...currentSec, biometricLock: false } });
      showToast('Biometric App Lock disabled.', 'info');
    }
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
                  style={{ width: '112px', height: '112px', minWidth: '112px', maxWidth: '112px' }}
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

      {/* 🔔 Notifications & Smart Alerts */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Notifications & Smart Alerts
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Receive timely alerts on your device for budget limit warnings, bill due dates, and daily logging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={!settings.notifications?.enabled}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              Test Alert
            </button>

            {/* Master Toggle */}
            <button
              type="button"
              onClick={() => handleToggleNotifications(!settings.notifications?.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.notifications?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.notifications?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {settings.notifications?.enabled ? (
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            {/* Sub-item: Budget Alerts */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-white">Budget Threshold Warnings</p>
                <p className="text-xs text-slate-400">
                  Notify me when any category spending reaches 80% or exceeds 100% of its monthly limit.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.budgetAlerts}
                onChange={(e) => handleUpdateNotificationSubPref('budgetAlerts', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
            </div>

            {/* Sub-item: Recurring Bill Reminders */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-white">Upcoming Bill Reminders</p>
                <p className="text-xs text-slate-400">
                  Get notified 1 day before recurring subscriptions and utility bills are due.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.recurringReminders}
                onChange={(e) => handleUpdateNotificationSubPref('recurringReminders', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
            </div>

            {/* Sub-item: Daily Expense Reminder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-semibold text-white">Daily Expense Check-in</p>
                <p className="text-xs text-slate-400">
                  Daily evening prompt to record expenses and keep accounts balanced.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {settings.notifications.dailyReminder && (
                  <input
                    type="time"
                    value={settings.notifications.dailyReminderTime || '20:00'}
                    onChange={(e) => handleUpdateNotificationSubPref('dailyReminderTime', e.target.value)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-emerald-500"
                  />
                )}
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyReminder}
                  onChange={(e) => handleUpdateNotificationSubPref('dailyReminder', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Enable notifications above to receive proactive budget warnings and payment reminders on this device.
          </p>
        )}
      </div>

      {/* 🛡️ Biometric Security & App Lock */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Biometric App Lock
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Require fingerprint or face recognition whenever FinTrack launches or resumes from the background.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Toggle */}
            <button
              type="button"
              onClick={() => handleToggleBiometricLock(!settings.security?.biometricLock)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.security?.biometricLock ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.security?.biometricLock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Hardware Status:</span>
            <span className="font-semibold text-white">{biometryInfo.title}</span>
          </div>

          <div className="text-[11px] text-slate-400">
            {settings.security?.biometricLock ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vault Protected on Exit
              </span>
            ) : (
              <span>Disabled — Quick access enabled</span>
            )}
          </div>
        </div>
      </div>

      {/* ☁️ Cloud Synchronization & Multi-Device Sync */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-400" />
              Cloud Synchronization & Multi-Device Sync
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Automatically sync your local IndexedDB vault to secure PostgreSQL cloud storage. Offline-first: changes sync automatically when back online.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : syncStatus === 'offline'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : syncStatus === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-ping'
                    : syncStatus === 'offline'
                    ? 'bg-slate-500'
                    : syncStatus === 'error'
                    ? 'bg-rose-400'
                    : 'bg-slate-500'
                }`}
              />
              {syncStatus === 'synced'
                ? 'Synced with Cloud'
                : syncStatus === 'syncing'
                ? 'Syncing...'
                : syncStatus === 'offline'
                ? 'Offline'
                : syncStatus === 'error'
                ? 'Sync Failed'
                : 'Local Only'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <span>Automatic Background Sync</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                Last-Write-Wins
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lastSyncedTime
                ? `Last synced: ${format(new Date(lastSyncedTime), 'MMM d, yyyy HH:mm:ss')}`
                : 'No sync recorded yet'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingNow || !isCloudSyncEnabled}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncingNow ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCloudSyncEnabled}
                onChange={(e) => handleToggleCloudSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {!isCloudUser && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-300">Local Guest Mode Active</span>
              <p className="text-slate-400">
                You are running FinTrack in local-only mode. All transactions remain safe in your browser's IndexedDB. Sign in or register to enable cloud sync across multiple browsers and your Android app.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 🤖 AI Financial Copilot & Intelligence Engine Configuration */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              AI Intelligence Engine & Models
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure your preferred intelligence engine for financial auditing, automated categorization, and conversational assistance.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {keyConfig.provider === 'local' ? 'Offline Private' : 'Gemini Cloud Proxy'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Option 1: Local Neural Rules */}
          <button
            type="button"
            onClick={() => setKeyConfig({ provider: 'local' })}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              keyConfig.provider === 'local'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Local Rule Engine</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero latency, runs directly on your device. Never requires internet or API keys.
            </p>
            {keyConfig.provider === 'local' && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Option 2: Google Gemini via Backend Proxy */}
          <button
            type="button"
            onClick={() => setKeyConfig({ provider: 'gemini' })}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              keyConfig.provider === 'gemini'
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Google Gemini 1.5 Flash</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                Server Proxy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proxied securely through your FinTrack backend. High reasoning capability with zero client-side key exposure.
            </p>
            {keyConfig.provider === 'gemini' && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-400">
            🔒 <strong className="text-slate-300">Privacy First:</strong> Gemini API keys are maintained exclusively on the backend server. The browser client never touches or stores API secrets.
          </p>
        </div>
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
