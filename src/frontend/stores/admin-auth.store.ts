'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
  'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'customer' | 'admin' | 'OWNER' | 'SUPERVISOR';

type AdminAuthStore = {
  user: { id: string; email?: string; mobile?: string; name?: string; role: UserRole } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AdminAuthStore['user']) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
};

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'admin-auth-storage' },
  ),
);
