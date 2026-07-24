'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WishlistStore = {
  items: { productId: string; name: string; price: number; image?: string }[];
  addItem: (item: { productId: string; name: string; price: number; image?: string }) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'wishlist-storage' },
  ),
);
