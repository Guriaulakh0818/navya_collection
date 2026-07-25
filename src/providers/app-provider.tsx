'use client';

import { ReactNode } from 'react';

import { StoreProvider } from './store-provider';
import { ToastProvider } from './toast-provider';

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <StoreProvider>
      <ToastProvider>{children}</ToastProvider>
    </StoreProvider>
  );
}
