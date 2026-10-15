import { create } from 'zustand';
import { UserProfile } from '../types';
import { api, setTokens, clearTokens, getRefreshToken } from '../lib/api';
import { syncManager } from '../lib/syncManager';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCloudUser: boolean;

  loadAuth: () => Promise<void>;
  login: (email: string, password?: string) => Promise<UserProfile>;
  signup: (name: string, email: string, password?: string) => Promise<UserProfile>;
  loginAsDemo: (demoType?: 'alex' | 'sarah') => Promise<UserProfile>;
  loginAsGuest: () => UserProfile;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const STORAGE_KEY = 'fintrack_auth_user';

function getStoredUser(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProfile;
      if (parsed && parsed.name && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored user:', e);
  }
  return null;
}

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: false,
  isCloudUser: !!localStorage.getItem('fintrack_access_token'),

  loadAuth: async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        if (user && user.email) {
          set({
            user,
            isAuthenticated: true,
            isCloudUser: !!localStorage.getItem('fintrack_access_token'),
            isLoading: false,
          });

          // Check if token exists, verify /me from backend and sync
          if (localStorage.getItem('fintrack_access_token')) {
            try {
              const res = await api.auth.me();
              if (res.user) {
                const refreshedUser: UserProfile = {
                  id: res.user.id,
                  name: res.user.name,
                  email: res.user.email,
                  avatarUrl: res.user.avatarUrl,
                  joinedAt: res.user.createdAt,
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedUser));
                set({ user: refreshedUser, isCloudUser: true });

                // Trigger background sync if cloud sync is enabled
                if (syncManager.isSyncEnabled()) {
                  syncManager.fullSync();
                }
              }
            } catch {
              // Server might be offline or sleeping; keep local session active
            }
          }
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }
    set({ user: null, isAuthenticated: false, isCloudUser: false, isLoading: false });
  },

  login: async (email: string, password = 'password123') => {
    set({ isLoading: true });

    try {
      // 1. Try real backend login
      const result = await api.auth.login({ email, password });
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);

      const user: UserProfile = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        avatarUrl: result.user.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        joinedAt: result.user.createdAt || new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      syncManager.setCloudSyncEnabled(true);
      set({ user, isAuthenticated: true, isCloudUser: true, isLoading: false });

      // Run background sync
      syncManager.fullSync();
      return user;
    } catch (err: any) {
      // If network failure / backend down or local demo mode
      console.warn('Backend login unavailable or failed, checking offline fallback:', err.message);

      // If user had existing local account or demo account, or invalid credentials
      if (err.status === 401 || err.status === 400 || err.status === 409) {
        set({ isLoading: false });
        throw err;
      }

      // Offline-first graceful fallback
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
        email,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isCloudUser: false, isLoading: false });
      return user;
    }
  },

  signup: async (name: string, email: string, password = 'password123') => {
    set({ isLoading: true });

    try {
      // 1. Try real backend register
      const result = await api.auth.register({ email, password, name });
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);

      const user: UserProfile = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        avatarUrl: result.user.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        joinedAt: result.user.createdAt || new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      syncManager.setCloudSyncEnabled(true);
      set({ user, isAuthenticated: true, isCloudUser: true, isLoading: false });

      // Trigger initial push to sync any local seeded data
      syncManager.fullSync();
      return user;
    } catch (err: any) {
      if (err.status === 409 || err.status === 400) {
        set({ isLoading: false });
        throw err;
      }

      console.warn('Backend signup error, falling back to local vault:', err.message);
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name,
        email,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isCloudUser: false, isLoading: false });
      return user;
    }
  },

  loginAsDemo: async (demoType = 'alex') => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 200));

    const user: UserProfile = demoType === 'sarah'
      ? {
          id: 'usr-demo-sarah',
          name: 'Sarah Jenkins',
          email: 'sarah.j@fintrack.app',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          joinedAt: '2026-01-15T00:00:00Z',
        }
      : {
          id: 'usr-demo-alex',
          name: 'Alex Morgan',
          email: 'alex.morgan@fintrack.app',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          joinedAt: '2026-01-10T00:00:00Z',
        };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isCloudUser: false, isLoading: false });
    return user;
  },

  loginAsGuest: () => {
    const user: UserProfile = {
      id: 'usr-guest-local',
      name: 'Guest Explorer',
      email: 'guest@fintrack.local',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isCloudUser: false, isLoading: false });
    return user;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {}
    }
    clearTokens();
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isCloudUser: false, isLoading: false });
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { user: updated, isAuthenticated: true };
    });
  },
}));
