'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistStoreItem {
  id?: string;
  productId: string;
  variantId?: string | null;
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
  selectedSize?: string | null;
  selectedColor?: string | null;
  variantName?: string | null;
}

interface WishlistStore {
  items: WishlistStoreItem[];
  count: number;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;

  fetchWishlist: () => Promise<void>;
  addItem: (
    item: WishlistStoreItem | (Partial<WishlistStoreItem> & { id: string }),
  ) => Promise<void>;
  removeItem: (productId: string, variantId?: string | null) => Promise<void>;
  toggleItem: (
    item: WishlistStoreItem | (Partial<WishlistStoreItem> & { id: string }),
  ) => Promise<void>;
  clearWishlist: () => Promise<void>;
  resetLocalWishlist: () => void;
  mergeGuestWishlist: () => Promise<void>;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
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
        const serverItems = data.items || [];
        // Preserve any client-side variant selections for products returned by the server
        const mergedItems = serverItems.map((sItem) => {
          const sPid = sItem.productId || (sItem as any).id;
          const localMatch = get().items.find(
            (lItem) => lItem.productId === sPid || (lItem as any).id === sPid,
          );
          return {
            ...sItem,
            productId: sPid,
            variantId: sItem.variantId || localMatch?.variantId || null,
            selectedSize: sItem.selectedSize || localMatch?.selectedSize || null,
            selectedColor: sItem.selectedColor || localMatch?.selectedColor || null,
            variantName: sItem.variantName || localMatch?.variantName || null,
          };
        });

        set({
          items: mergedItems,
          count: mergedItems.length,
          isGuest: false,
          isLoading: false,
          error: null,
        });
      },

      isInWishlist: (productId, variantId) => {
        if (!productId) return false;
        return get().items.some((i) => {
          const matchPid = i.productId === productId || (i as any).id === productId;
          if (!matchPid) return false;
          if (variantId && i.variantId) {
            return i.variantId === variantId;
          }
          return true;
        });
      },

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

      addItem: async (rawItem) => {
        const state = get();
        const pid = rawItem.productId || (rawItem as any).id;
        if (!pid) return;

        const vid = rawItem.variantId || null;

        // Check if this exact product (and variant, if provided) is already in wishlist
        const alreadyExists = state.items.some((i) => {
          const matchPid = i.productId === pid || (i as any).id === pid;
          if (!matchPid) return false;
          if (vid && i.variantId) {
            return i.variantId === vid;
          }
          return !vid && !i.variantId;
        });

        if (alreadyExists) return;

        const normalizedItem: WishlistStoreItem = {
          id: rawItem.id || pid,
          productId: pid,
          variantId: vid,
          name: rawItem.name || 'Navya Couture',
          slug: rawItem.slug || '',
          price: Number(rawItem.price || 0),
          compareAtPrice: rawItem.compareAtPrice ? Number(rawItem.compareAtPrice) : null,
          image: rawItem.image || '',
          inStock: rawItem.inStock ?? true,
          categoryName: rawItem.categoryName || null,
          createdAt: rawItem.createdAt || new Date().toISOString(),
          shopId: rawItem.shopId,
          shopName: rawItem.shopName,
          shopSlug: rawItem.shopSlug,
          shopLogo: rawItem.shopLogo,
          selectedSize: rawItem.selectedSize || null,
          selectedColor: rawItem.selectedColor || null,
          variantName: rawItem.variantName || null,
        };

        // Optimistically add to local state immediately
        const updated = [...state.items, normalizedItem];
        set({ items: updated, count: updated.length, error: null });

        // 1. Guest Mode: persistence via localStorage is already handled by Zustand persist
        if (state.isGuest) {
          return;
        }

        // 2. Logged-in Mode: sync with database
        try {
          const res = await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: pid, variantId: vid }),
          });

          if (res.status === 401) {
            // User session expired or unauthenticated -> fallback smoothly to guest mode
            set({ isGuest: true });
            return;
          }

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch (err: any) {
          // Keep optimistic item in local store even if network hiccups
          console.warn('[WISHLIST_ADD_SYNC_WARNING]', err?.message);
        }
      },

      removeItem: async (productId, variantId) => {
        const state = get();
        if (!productId) return;

        // Optimistically remove from state
        const updated = state.items.filter((i) => {
          const matchPid = i.productId === productId || (i as any).id === productId;
          if (!matchPid) return true; // keep
          if (variantId && i.variantId) {
            return i.variantId !== variantId; // remove specific variant
          }
          return false; // remove all matching product ID
        });

        set({ items: updated, count: updated.length, error: null });

        // 1. Guest Mode
        if (state.isGuest) {
          return;
        }

        // 2. Logged-in Mode
        try {
          const res = await fetch(`/api/v1/wishlist/${productId}`, {
            method: 'DELETE',
          });

          if (res.status === 401) {
            set({ isGuest: true });
            return;
          }

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch (err: any) {
          console.warn('[WISHLIST_REMOVE_SYNC_WARNING]', err?.message);
        }
      },

      toggleItem: async (rawItem) => {
        const pid = rawItem.productId || (rawItem as any).id;
        if (!pid) return;
        const vid = rawItem.variantId || null;

        if (get().isInWishlist(pid, vid)) {
          await get().removeItem(pid, vid);
        } else {
          await get().addItem(rawItem as WishlistStoreItem);
        }
      },

      clearWishlist: async () => {
        const state = get();
        set({ items: [], count: 0, isLoading: false, error: null });

        if (!state.isGuest) {
          // Clear all database wishlist items for logged in user
          try {
            for (const item of state.items) {
              await fetch(`/api/v1/wishlist/${item.productId}`, { method: 'DELETE' });
            }
          } catch {}
        }
      },

      resetLocalWishlist: () => {
        set({ items: [], count: 0, isGuest: true, isLoading: false, error: null });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('wishlist-storage');
          } catch {}
        }
      },

      mergeGuestWishlist: async () => {
        const state = get();
        const guestProductIds = Array.from(
          new Set(
            state.items
              .map((i) => i.productId || (i as any).id)
              .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
          ),
        );

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
