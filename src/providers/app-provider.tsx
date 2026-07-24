'use client';

import { ReactNode } from 'react';

import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { StoreProvider } from './store-provider';
import { ThemeProvider } from './theme-provider';

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
