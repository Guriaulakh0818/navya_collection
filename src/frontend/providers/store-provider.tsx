'use client';

import { ReactNode } from 'react';

import {
  useAuthStore,
  useCartStore,
  useCheckoutStore,
  useUiStore,
  useWishlistStore,
} from '@/stores';

type StoreProviderProps = {
  children: ReactNode;
};

export function StoreProvider({ children }: StoreProviderProps) {
  useAuthStore();
  useCartStore();
  useWishlistStore();
  useCheckoutStore();
  useUiStore();

  return <>{children}</>;
}
