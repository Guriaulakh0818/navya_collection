'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  getSession,
  logout as logoutService,
  sendOtp as sendOtpService,
  verifyOtp as verifyOtpService,
} from '@/services/auth';
import { useAuthStore } from '@/stores';

type User = {
  id: string;
  mobile: string;
  name?: string;
  email?: string;
  role: 'customer' | 'admin';
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    mobile: string,
    otp: string,
  ) => Promise<{ success: boolean; token?: string; user?: object; message?: string } | void>;
  logout: () => Promise<void>;
  verifyOtp: (
    mobile: string,
    otp: string,
  ) => Promise<{ success: boolean; token?: string; user?: object; message?: string } | void>;
  sendOtp: (mobile: string) => Promise<{ success: boolean; message?: string } | void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setUser: setStoreUser, setToken, logout: clearStore } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await getSession();
        if (session?.authenticated && session?.user) {
          const userData = session.user as User;
          setUser(userData);
          setStoreUser(userData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setStoreUser]);

  const sendOtp = useCallback(async (mobile: string) => {
    setIsLoading(true);
    try {
      const response = await sendOtpService(mobile);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (mobile: string, otp: string) => {
      setIsLoading(true);
      try {
        const response = await verifyOtpService(mobile, otp);
        if (response.success && response.token && response.user) {
          const userData = response.user as User;
          setUser(userData);
          setStoreUser(userData);
          setToken(response.token);
          return response;
        }
        throw new Error(response.message || 'Invalid OTP');
      } finally {
        setIsLoading(false);
      }
    },
    [setStoreUser, setToken],
  );

  const login = useCallback(
    async (mobile: string, _otp: string) => {
      await verifyOtp(mobile, _otp);
    },
    [verifyOtp],
  );

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } finally {
      setUser(null);
      clearStore();
      router.push('/login');
    }
  }, [clearStore, router]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, verifyOtp, sendOtp }}
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
