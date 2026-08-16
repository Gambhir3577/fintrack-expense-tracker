import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loadAuth: () => void;
  login: (email: string, name?: string) => Promise<UserProfile>;
  signup: (name: string, email: string) => Promise<UserProfile>;
  loginAsDemo: (demoType?: 'alex' | 'sarah') => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const STORAGE_KEY = 'fintrack_auth_user';

function getStoredUser(): UserProfile {
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

  // Default initial profile for instant seamless first launch
  const initialUser: UserProfile = {
    id: 'usr-primary',
    name: 'Alex Morgan',
    email: 'alex.morgan@fintrack.app',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    joinedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUser));
  } catch {}

  return initialUser;
}

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: true,
  isLoading: false,

  loadAuth: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    }
    const defaultUser = getStoredUser();
    set({ user: defaultUser, isAuthenticated: true, isLoading: false });
  },

  login: async (email: string, name?: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
      email,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  signup: async (name: string, email: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 400));

    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
    return user;
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
    set({ user, isAuthenticated: true, isLoading: false });
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateProfile: (updates) => {
    set((state) => {
      const currentUser = state.user || getStoredUser();
      const updated = { ...currentUser, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { user: updated, isAuthenticated: true };
    });
  },
}));
