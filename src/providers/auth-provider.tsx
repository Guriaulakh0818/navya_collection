'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  login: (mobile: string, otp: string) => Promise<void>;
  logout: () => void;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  sendOtp: (mobile: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = useCallback(async (mobile: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      if (!response.ok) throw new Error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (mobile: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      if (!response.ok) throw new Error('Invalid OTP');
      const data = await response.json();
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (mobile: string, _otp: string) => {
    await verifyOtp(mobile, _otp);
  }, [verifyOtp]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, verifyOtp, sendOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
