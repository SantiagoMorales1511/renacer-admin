import { create } from 'zustand';
import { api, tokenStore } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  loadMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.accessToken);
    set({ user: data.user });
    return data.user as User;
  },
  logout: () => {
    tokenStore.clear();
    set({ user: null });
  },
  loadMe: async () => {
    const token = tokenStore.get();
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false });
    }
  },
}));
