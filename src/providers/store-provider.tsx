'use client';

import { ReactNode, createContext, useContext } from 'react';

const StoreContext = createContext<Record<string, unknown>>({});

export function StoreProvider({ children, value }: { children: ReactNode; value: Record<string, unknown> }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore<T = Record<string, unknown>>() {
  const context = useContext(StoreContext);
  return context as T;
}
