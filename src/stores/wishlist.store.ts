'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WishlistItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
};

type WishlistStore = {
  items: WishlistItem[];
  isGuest: boolean;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (item: WishlistItem) => void;
  syncFromUserWishlist: (items: WishlistItem[]) => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isGuest: true,
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (productId) => get().items.some((i) => i.productId === productId),
      toggleItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },
      syncFromUserWishlist: (items) => set({ items, isGuest: false }),
    }),
    { name: 'wishlist-storage' },
  ),
);
