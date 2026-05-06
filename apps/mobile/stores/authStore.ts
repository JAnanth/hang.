import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@hang/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('session_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partial };
      set({ user: updated });
      SecureStore.setItemAsync('user_data', JSON.stringify(updated)).catch(() => null);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('session_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, userData] = await Promise.all([
        SecureStore.getItemAsync('session_token'),
        SecureStore.getItemAsync('user_data'),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData) as User;
        set({ token, user, isAuthenticated: true });
      }
    } catch {
      // storage error — treat as logged out
    } finally {
      set({ isLoading: false });
    }
  },
}));
