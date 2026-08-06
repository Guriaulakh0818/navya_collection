'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistStoreItem {
  id?: string;
  productId: string;
  name: string;
  slug?: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string;
  inStock?: boolean;
  categoryName?: string | null;
  createdAt?: string | Date;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  shopLogo?: string;
}

interface WishlistStore {
  items: WishlistStoreItem[];
  count: number;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;

  fetchWishlist: () => Promise<void>;
  addItem: (item: WishlistStoreItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (item: WishlistStoreItem) => Promise<void>;
  clearWishlist: () => Promise<void>;
  mergeGuestWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWithServer: (data: { items: WishlistStoreItem[]; count: number }) => void;
  setGuestMode: (isGuest: boolean) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      isGuest: true,
      isLoading: false,
      error: null,

      setGuestMode: (isGuest) => set({ isGuest }),

      syncWithServer: (data) => {
        set({
          items: data.items || [],
          count: data.count || data.items?.length || 0,
          isGuest: false,
          isLoading: false,
          error: null,
        });
      },

      isInWishlist: (productId) => get().items.some((i) => i.productId === productId),

      fetchWishlist: async () => {
        if (get().isGuest) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/v1/wishlist', { method: 'GET' });
          if (res.status === 401) {
            set({ isGuest: true, isLoading: false });
            return;
          }
          const json = await res.json();
          if (json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({ isLoading: false, error: json.message || 'Failed to load wishlist' });
          }
        } catch {
          set({ isLoading: false, error: 'Network error loading wishlist' });
        }
      },

      addItem: async (item) => {
        const state = get();
        if (state.isInWishlist(item.productId)) return;

        // 1. Guest Mode
        if (state.isGuest) {
          const updated = [...state.items, item];
          set({ items: updated, count: updated.length, error: null });
          return;
        }

        // 2. Logged-in Mode
        const previousState = { ...state };
        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.productId }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({
              ...previousState,
              isLoading: false,
              error: json.message || 'Failed to add to wishlist',
            });
          }
        } catch (err: any) {
          set({ ...previousState, isLoading: false, error: err.message || 'Network error' });
        }
      },

      removeItem: async (productId) => {
        const state = get();

        // 1. Guest Mode
        if (state.isGuest) {
          const updated = state.items.filter((i) => i.productId !== productId);
          set({ items: updated, count: updated.length, error: null });
          return;
        }

        // 2. Logged-in Mode
        const previousState = { ...state };
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`/api/v1/wishlist/${productId}`, {
            method: 'DELETE',
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({
              ...previousState,
              isLoading: false,
              error: json.message || 'Failed to remove from wishlist',
            });
          }
        } catch (err: any) {
          set({ ...previousState, isLoading: false, error: err.message || 'Network error' });
        }
      },

      toggleItem: async (item) => {
        if (get().isInWishlist(item.productId)) {
          await get().removeItem(item.productId);
        } else {
          await get().addItem(item);
        }
      },

      clearWishlist: async () => {
        set({ items: [], count: 0, isLoading: false, error: null });
      },

      mergeGuestWishlist: async () => {
        const state = get();
        const guestProductIds = state.items.map((i) => i.productId);

        if (guestProductIds.length === 0) {
          await get().fetchWishlist();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/v1/wishlist/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: guestProductIds }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({ isLoading: false, error: json.message || 'Wishlist merge failed' });
          }
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Network error during wishlist merge' });
        }
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items,
        count: state.count,
        isGuest: state.isGuest,
      }),
    },
  ),
);
