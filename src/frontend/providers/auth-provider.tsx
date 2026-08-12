'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import {
  getSession,
  logout as logoutService,
  sendOtp as sendOtpService,
  verifyOtp as verifyOtpService,
} from '@/services/auth';
import { useAuthStore, useCartStore, useWishlistStore } from '@/stores';

type User = {
  id: string;
  mobile?: string;
  name?: string;
  email?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'OWNER' | 'SUPERVISOR' | 'customer' | 'admin' | string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    mobile: string,
    otp: string,
  ) => Promise<{ success: boolean; token?: string; user?: object; message?: string } | void>;
  logout: (redirectPath?: string) => Promise<void>;
  verifyOtp: (
    mobile: string,
    otp: string,
  ) => Promise<{ success: boolean; token?: string; user?: object; message?: string } | void>;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message?: string } | void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const storeUser = useAuthStore((s) => s.user);
  const { setUser: setStoreUser, setToken, logout: clearStore } = useAuthStore();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = storeUser || localUser;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getSession();
        if (session?.authenticated && session?.user) {
          const userData = session.user as User;
          setLocalUser(userData);
          setStoreUser(userData as any);
        } else {
          setLocalUser(null);
          clearStore();
        }
      } catch {
        setLocalUser(null);
        clearStore();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setStoreUser, clearStore]);

  const sendOtp = useCallback(async (mobile: string) => {
    const response = await sendOtpService(mobile);
    if (!response.success) {
      throw new Error(response.message || 'Failed to send OTP');
    }
    return response;
  }, []);

  const verifyOtp = useCallback(
    async (mobile: string, otp: string) => {
      const response = await verifyOtpService(mobile, otp);
      if (response.success && response.user) {
        const userData = response.user as User;
        setLocalUser(userData);
        setStoreUser(userData as any);
        if (response.token) {
          setToken(response.token);
        }
        return response;
      }
      throw new Error(response.message || 'Invalid OTP');
    },
    [setStoreUser, setToken],
  );

  const login = useCallback(
    async (mobile: string, _otp: string) => {
      await verifyOtp(mobile, _otp);
    },
    [verifyOtp],
  );

  const logout = useCallback(
    async (redirectPath?: string) => {
      const userRole = currentUser?.role?.toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

      const targetRedirect = redirectPath || (isAdmin ? '/admin/login' : '/');

      try {
        await logoutService();
      } catch (err) {
        console.warn('Logout Note:', err);
      } finally {
        setLocalUser(null);
        clearStore();
        try {
          useCartStore.getState().resetLocalCart();
        } catch {}
        try {
          useWishlistStore.getState().resetLocalWishlist();
        } catch {}
        window.location.href = targetRedirect;
      }
    },
    [currentUser, clearStore],
  );

  return (
    <AuthContext.Provider
      value={{
        user: currentUser as User | null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        verifyOtp,
        sendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
