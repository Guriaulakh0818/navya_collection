'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'customer' | 'admin';

type AuthStore = {
  user: { id: string; mobile?: string; name?: string; role: UserRole } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthStore['user']) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' },
  ),
);
