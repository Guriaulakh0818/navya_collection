'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { AppliedCoupon } from '@/features/coupons/components/CouponInputCard';

export interface CartStoreItem {
  id: string;
  cartId?: string;
  productId: string;
  variantId?: string | null;
  name: string;
  productName?: string;
  productSlug?: string;
  variantName?: string | null;
  size?: string | null;
  color?: string | null;
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  availableStock?: number;
  image?: string;
  subtotal?: number;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  shopLogo?: string;
}

export interface CartCalculatedTotals {
  id?: string;
  userId?: string;
  items: CartStoreItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  appliedCoupon?: AppliedCoupon | null;
}

interface CartStore extends CartCalculatedTotals {
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;

  // Cart Actions
  fetchCart: () => Promise<void>;
  addItem: (item: {
    id?: string;
    productId: string;
    variantId?: string | null;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    quantity?: number;
    availableStock?: number;
    image?: string;
    shopId?: string;
    shopName?: string;
    shopSlug?: string;
    shopLogo?: string;
  }) => Promise<void>;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => Promise<void>;
  removeItem: (itemIdOrProductId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  syncWithServer: (data: CartCalculatedTotals) => void;
  setGuestMode: (isGuest: boolean) => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
}

const DEFAULT_TOTALS: CartCalculatedTotals = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  freeShippingThreshold: 999,
  freeShippingRemaining: 999,
};

function calculateTotals(items: CartStoreItem[]): CartCalculatedTotals {
  let subtotal = 0;
  let originalSubtotal = 0;

  const validItems = items.map((item) => {
    const itemSubtotal = item.price * item.quantity;
    subtotal += itemSubtotal;
    originalSubtotal += (item.compareAtPrice || item.price) * item.quantity;
    return {
      ...item,
      subtotal: itemSubtotal,
    };
  });

  const discount = Math.max(0, originalSubtotal - subtotal);
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal + shipping);

  return {
    items: validItems,
    itemCount: validItems.reduce((acc, item) => acc + item.quantity, 0),
    subtotal,
    discount,
    shipping,
    total,
    freeShippingThreshold: 999,
    freeShippingRemaining: Math.max(0, 999 - subtotal),
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_TOTALS,
      isGuest: true,
      isLoading: false,
      error: null,

      setGuestMode: (isGuest) => set({ isGuest }),
      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon }),

      syncWithServer: (serverCart) => {
        if (!serverCart) return;

        // Protect local cart state: If server returns 0 items while client has items, retain client items
        const currentItems = get().items;
        if ((!serverCart.items || serverCart.items.length === 0) && currentItems.length > 0) {
          set({
            isGuest: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        set({
          ...serverCart,
          isGuest: false,
          isLoading: false,
          error: null,
        });
      },

      fetchCart: async () => {
        if (get().isGuest) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/v1/cart', { method: 'GET' });
          if (res.status === 401) {
            set({ isGuest: true, isLoading: false });
            return;
          }
          const json = await res.json();
          if (json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({ isLoading: false, error: json.message || 'Failed to load cart' });
          }
        } catch {
          set({ isLoading: false, error: 'Network error loading cart' });
        }
      },

      addItem: async (input) => {
        const quantityToAdd = input.quantity || 1;
        const state = get();

        // 1. Immediate Local State Update (Optimistic update for guest & logged-in)
        const existingIndex = state.items.findIndex(
          (i) =>
            i.productId === input.productId && (i.variantId || null) === (input.variantId || null),
        );

        let updatedItems: CartStoreItem[];
        if (existingIndex !== -1) {
          updatedItems = [...state.items];
          const existing = updatedItems[existingIndex];
          const maxStock = input.availableStock || existing.availableStock || 99;
          const newQty = Math.min(existing.quantity + quantityToAdd, maxStock);

          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQty,
          };
        } else {
          const newItem: CartStoreItem = {
            id: `item_${Date.now()}_${Math.random()}`,
            productId: input.productId,
            variantId: input.variantId || null,
            name: input.name,
            price: input.price,
            compareAtPrice: input.compareAtPrice,
            quantity: Math.min(quantityToAdd, input.availableStock || 99),
            availableStock: input.availableStock || 99,
            image: input.image,
          };
          updatedItems = [...state.items, newItem];
        }

        const totals = calculateTotals(updatedItems);
        set({ ...totals, error: null });

        if (state.isGuest) return;

        // 2. Background server sync for logged-in users
        try {
          const res = await fetch('/api/v1/cart/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: input.productId,
              variantId: input.variantId || undefined,
              quantity: quantityToAdd,
              name: input.name,
              price: input.price,
              image: input.image,
            }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch {
          // Retain local optimistic state if server sync fails temporarily
        }
      },

      updateQuantity: async (itemIdOrProductId, newQuantity) => {
        if (newQuantity < 1) return;
        const state = get();

        // 1. Optimistic Local State Update so UI buttons respond instantly
        const updatedItems = state.items.map((i) => {
          if (i.id === itemIdOrProductId || i.productId === itemIdOrProductId) {
            const maxStock = i.availableStock || 99;
            return { ...i, quantity: Math.min(newQuantity, maxStock) };
          }
          return i;
        });

        const totals = calculateTotals(updatedItems);
        set({ ...totals, error: null });

        if (state.isGuest) return;

        // 2. Logged-in Server Sync
        const targetItem = state.items.find(
          (i) => i.id === itemIdOrProductId || i.productId === itemIdOrProductId,
        );
        if (!targetItem) return;

        try {
          const res = await fetch(`/api/v1/cart/items/${targetItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch {}
      },

      removeItem: async (itemIdOrProductId) => {
        const state = get();

        // 1. Optimistic Local Removal
        const updatedItems = state.items.filter(
          (i) => i.id !== itemIdOrProductId && i.productId !== itemIdOrProductId,
        );
        const totals = calculateTotals(updatedItems);
        set({ ...totals, error: null });

        if (state.isGuest) return;

        // 2. Logged-in Server Sync
        const targetItem = state.items.find(
          (i) => i.id === itemIdOrProductId || i.productId === itemIdOrProductId,
        );
        if (!targetItem) return;

        try {
          const res = await fetch(`/api/v1/cart/items/${targetItem.id}`, {
            method: 'DELETE',
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch {}
      },

      clearCart: async () => {
        // 1. Optimistic Local Clear
        set({ ...DEFAULT_TOTALS, isLoading: false, error: null });

        const state = get();
        if (state.isGuest) return;

        // 2. Logged-in Server Sync
        try {
          const res = await fetch('/api/v1/cart', { method: 'DELETE' });
          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          }
        } catch {}
      },

      mergeGuestCart: async () => {
        const state = get();

        // If already in logged-in mode, fetch current cart without re-merging
        if (!state.isGuest) {
          await get().fetchCart();
          return;
        }

        const guestItems = state.items;

        if (guestItems.length === 0) {
          await get().fetchCart();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const payloadItems = guestItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            image: item.image,
          }));

          const res = await fetch('/api/v1/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payloadItems }),
          });

          const json = await res.json();
          if (res.ok && json.success && json.data) {
            get().syncWithServer(json.data);
          } else {
            set({ isLoading: false, error: json.message || 'Cart merge failed' });
          }
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Network error during cart merge' });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        isGuest: state.isGuest,
        appliedCoupon: state.appliedCoupon,
      }),
    },
  ),
);
