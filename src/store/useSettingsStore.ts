import { create } from 'zustand';
import { UserSettings, SupportedCurrency } from '../types';
import { db } from '../db';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  toast: ToastState;

  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  setTheme: (theme: 'dark' | 'light' | 'system') => Promise<void>;
  showToast: (message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
}

const defaultSettings: UserSettings = {
  currency: 'USD',
  theme: 'dark',
  dateFormat: 'YYYY-MM-DD',
  firstDayOfWeek: 1,
  hasCompletedOnboarding: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  toast: { show: false, message: '', type: 'info' },

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      let saved = await db.settings.get('app-settings');
      if (!saved) {
        await db.settings.put({ id: 'app-settings', ...defaultSettings });
        saved = { id: 'app-settings', ...defaultSettings };
      }
      set({ settings: saved, isLoading: false });
      
      // Apply theme to document element
      applyTheme(saved.theme);
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const current = get().settings;
    const updated: UserSettings & { id: string } = {
      ...current,
      ...newSettings,
      id: 'app-settings',
    };
    await db.settings.put(updated);
    set({ settings: updated });

    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
  },

  setCurrency: async (currency: SupportedCurrency) => {
    await get().updateSettings({ currency });
  },

  setTheme: async (theme: 'dark' | 'light' | 'system') => {
    await get().updateSettings({ theme });
  },

  showToast: (message: string, type: ToastState['type'] = 'info') => {
    set({ toast: { show: true, message, type } });
    setTimeout(() => {
      set((state) => {
        if (state.toast.message === message) {
          return { toast: { ...state.toast, show: false } };
        }
        return state;
      });
    }, 4000);
  },

  hideToast: () => {
    set({ toast: { show: false, message: '', type: 'info' } });
  },
}));

function applyTheme(theme: 'dark' | 'light' | 'system') {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
