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
  isAvailable?: boolean;
  inStock?: boolean;
  availabilityStatus?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DELETED' | 'INACTIVE';
  availabilityMessage?: string;
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
  validateCart: () => Promise<{
    hasUnavailableItems: boolean;
    unavailableCount: number;
    availableCount: number;
  }>;
  removeUnavailableItems: () => Promise<void>;
  addItem: (item: {
    id?: string;
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
    quantity?: number;
    availableStock?: number;
    image?: string;
    shopId?: string;
    shopName?: string;
    shopSlug?: string;
    shopLogo?: string;
  }) => Promise<void>;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => Promise<void>;
  removeItem: (itemIdOrProductId: string, variantId?: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  resetLocalCart: () => void;
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
    const isAvail = item.isAvailable !== false;
    const itemSubtotal = isAvail ? item.price * item.quantity : 0;
    if (isAvail) {
      subtotal += itemSubtotal;
      originalSubtotal += (item.compareAtPrice || item.price) * item.quantity;
    }
    return {
      ...item,
      subtotal: itemSubtotal,
    };
  });

  const discount = Math.max(0, originalSubtotal - subtotal);

  // BM-05: Calculate seller-level shipping (₹49 standard per seller shipment < ₹999, free if >= ₹999)
  // Only calculate for available items!
  const availableItems = validItems.filter((i) => i.isAvailable !== false);
  const sellerSubtotals = new Map<string, number>();
  for (const item of availableItems) {
    const sId = (item as any).shopId || 'default-shop';
    sellerSubtotals.set(sId, (sellerSubtotals.get(sId) || 0) + item.price * item.quantity);
  }

  let shipping = 0;
  let maxRemaining = 0;
  for (const [, sTotal] of sellerSubtotals.entries()) {
    if (sTotal < 999) {
      shipping += 49;
      maxRemaining = Math.max(maxRemaining, 999 - sTotal);
    }
  }
  if (availableItems.length === 0) {
    shipping = 0;
    maxRemaining = 0;
  }

  const total = Math.max(0, subtotal + shipping);

  return {
    items: validItems,
    itemCount: availableItems.reduce((acc, item) => acc + item.quantity, 0),
    subtotal,
    discount,
    shipping,
    total,
    freeShippingThreshold: 999,
    freeShippingRemaining: maxRemaining,
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

        const currentLocal = get().items;
        // Keep any local items that aren't yet reflected in serverCart (e.g. concurrent in-flight additions)
        const inFlightItems = currentLocal.filter((localItem) => {
          return !serverCart.items?.some((serverItem: any) => {
            if (serverItem.productId !== localItem.productId) return false;
            if (serverItem.variantId || localItem.variantId) {
              return (serverItem.variantId || null) === (localItem.variantId || null);
            }
            const sameSize = (serverItem.size || null) === (localItem.size || null);
            const sameColor = (serverItem.color || null) === (localItem.color || null);
            return sameSize && sameColor;
          });
        });

        const mergedItems = [...(serverCart.items || []), ...inFlightItems];
        const totals = calculateTotals(mergedItems);

        set({
          ...serverCart,
          items: mergedItems,
          itemCount: mergedItems.reduce((acc, i) => acc + i.quantity, 0),
          subtotal: totals.subtotal,
          total: totals.total,
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

      validateCart: async () => {
        const currentItems = get().items;
        if (currentItems.length === 0) {
          return { hasUnavailableItems: false, unavailableCount: 0, availableCount: 0 };
        }

        try {
          const res = await fetch('/api/v1/cart/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: currentItems.map((i) => ({
                id: i.id,
                productId: i.productId,
                variantId: i.variantId || undefined,
                sku: i.sku || undefined,
                size: i.size || undefined,
                color: i.color || undefined,
                quantity: i.quantity,
              })),
            }),
          });

          const json = await res.json();
          if (json.success && json.data) {
            const validated = json.data.items || [];
            const validatedMap = new Map<string, any>();
            for (const v of validated) {
              validatedMap.set(v.id, v);
              validatedMap.set(`${v.productId}_${v.variantId || 'null'}`, v);
            }

            const updatedItems = currentItems.map((item) => {
              const match =
                validatedMap.get(item.id) ||
                validatedMap.get(`${item.productId}_${item.variantId || 'null'}`) ||
                validatedMap.get(item.productId);

              if (match) {
                return {
                  ...item,
                  isAvailable: match.isAvailable,
                  inStock: match.inStock,
                  availableStock: match.availableStock,
                  availabilityStatus: match.availabilityStatus,
                  availabilityMessage: match.availabilityMessage,
                };
              }
              return item;
            });

            const totals = calculateTotals(updatedItems);
            set({ ...totals, items: updatedItems });

            return {
              hasUnavailableItems: json.data.hasUnavailableItems,
              unavailableCount: json.data.unavailableCount,
              availableCount: json.data.availableCount,
            };
          }
        } catch (err) {
          console.error('[CART_STORE_VALIDATE_ERROR]', err);
        }

        return {
          hasUnavailableItems: false,
          unavailableCount: 0,
          availableCount: currentItems.length,
        };
      },

      removeUnavailableItems: async () => {
        const state = get();
        const unavailableItems = state.items.filter((i) => i.isAvailable === false);
        const remainingItems = state.items.filter((i) => i.isAvailable !== false);
        const totals = calculateTotals(remainingItems);
        set({ ...totals, items: remainingItems, error: null });

        if (!state.isGuest) {
          for (const item of unavailableItems) {
            try {
              const deleteId = item.id.startsWith('item_') ? item.productId : item.id;
              await fetch(`/api/v1/cart/items/${deleteId}`, { method: 'DELETE' });
            } catch {}
          }
        }
      },

      addItem: async (input) => {
        const quantityToAdd = input.quantity || 1;
        const state = get();
        const cleanVariantId = input.variantId || null;

        // 1. Immediate Local State Update (Optimistic update for guest & logged-in)
        const existingIndex = state.items.findIndex((i) => {
          if (i.productId !== input.productId) return false;
          if (cleanVariantId || i.variantId) {
            return (i.variantId || null) === cleanVariantId;
          }
          const sameSize = (i.size || null) === (input.size || null);
          const sameColor = (i.color || null) === (input.color || null);
          return sameSize && sameColor;
        });

        let updatedItems: CartStoreItem[];
        if (existingIndex !== -1) {
          updatedItems = [...state.items];
          const existing = updatedItems[existingIndex];
          const maxStock = input.availableStock || existing.availableStock || 99;
          const newQty = Math.min(existing.quantity + quantityToAdd, maxStock);

          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQty,
            price: Number(input.price),
            compareAtPrice: input.compareAtPrice ?? existing.compareAtPrice,
            image: input.image || existing.image,
          };
        } else {
          const newItem: CartStoreItem = {
            id: input.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            productId: input.productId,
            variantId: cleanVariantId,
            name: input.name,
            productName: input.productName || input.name,
            productSlug: input.productSlug,
            variantName: input.variantName || null,
            size: input.size || null,
            color: input.color || null,
            sku: input.sku,
            price: Number(input.price),
            compareAtPrice: input.compareAtPrice,
            quantity: Math.min(quantityToAdd, input.availableStock || 99),
            availableStock: input.availableStock || 99,
            image: input.image,
            shopId: input.shopId || 'independent-shop',
            shopName: input.shopName || 'Independent Vendor',
            shopSlug: input.shopSlug || 'shop',
            shopLogo: input.shopLogo,
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
              variantId: cleanVariantId || undefined,
              quantity: quantityToAdd,
              name: input.name,
              price: Number(input.price),
              image: input.image,
              size: input.size || undefined,
              color: input.color || undefined,
              sku: input.sku || undefined,
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
        if (newQuantity <= 0) {
          await get().removeItem(itemIdOrProductId);
          return;
        }
        const state = get();

        // 1. Optimistic Local State Update so UI buttons respond instantly
        const updatedItems = state.items.map((i) => {
          if (i.id === itemIdOrProductId || (!i.variantId && i.productId === itemIdOrProductId)) {
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
          (i) => i.id === itemIdOrProductId || (!i.variantId && i.productId === itemIdOrProductId),
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

      removeItem: async (itemIdOrProductId, variantId) => {
        const state = get();

        // 1. Optimistic Local Removal
        const updatedItems = state.items.filter((i) => {
          if (i.id === itemIdOrProductId) return false;
          if (
            i.productId === itemIdOrProductId &&
            (variantId === undefined || (i.variantId || null) === (variantId || null))
          ) {
            return false;
          }
          return true;
        });
        const totals = calculateTotals(updatedItems);
        set({ ...totals, error: null });

        if (state.isGuest) return;

        // 2. Logged-in Server Sync
        const targetItem = state.items.find((i) => {
          if (i.id === itemIdOrProductId) return true;
          if (
            i.productId === itemIdOrProductId &&
            (variantId === undefined || (i.variantId || null) === (variantId || null))
          ) {
            return true;
          }
          return false;
        });
        if (!targetItem) return;

        try {
          const deleteId = targetItem.id.startsWith('item_') ? targetItem.productId : targetItem.id;
          const res = await fetch(`/api/v1/cart/items/${deleteId}`, {
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

      resetLocalCart: () => {
        set({
          ...DEFAULT_TOTALS,
          isGuest: true,
          isLoading: false,
          error: null,
          appliedCoupon: null,
        });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('cart-storage');
          } catch {}
        }
      },

      mergeGuestCart: async () => {
        const state = get();
        const localItems = state.items;

        if (localItems.length === 0) {
          set({ isGuest: false });
          await get().fetchCart();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const payloadItems = localItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size || undefined,
            color: item.color || undefined,
            sku: item.sku || undefined,
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
            set({ isGuest: false, isLoading: false, error: json.message || 'Cart merge failed' });
          }
        } catch (err: any) {
          set({
            isGuest: false,
            isLoading: false,
            error: err.message || 'Network error during cart merge',
          });
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
