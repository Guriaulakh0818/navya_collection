'use client';

import { useEffect, useRef } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { useCartStore } from '@/stores/cart.store';
import { useWishlistStore } from '@/stores/wishlist.store';

/**
 * CartSyncProvider Component
 *
 * Listens to authentication state changes. When a customer logs in,
 * it automatically merges guest localStorage cart & wishlist with database PostgreSQL records,
 * refreshes Zustand stores, and switches to active server mode.
 */
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasMergedRef = useRef(false);
  const wasAuthRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      wasAuthRef.current = true;
      if (!hasMergedRef.current) {
        hasMergedRef.current = true;

        // Perform guest merge ONLY if stores are currently in guest mode, otherwise simply fetch server cart
        const cartState = useCartStore.getState();
        if (cartState.isGuest) {
          cartState.mergeGuestCart();
        } else {
          cartState.fetchCart();
        }

        const wishlistState = useWishlistStore.getState();
        if (wishlistState.isGuest) {
          wishlistState.mergeGuestWishlist();
        } else {
          wishlistState.fetchWishlist();
        }

        // Restore pending cart item if user tried to add to cart while unauthenticated
        if (typeof window !== 'undefined') {
          const rawPending = sessionStorage.getItem('jiivaa_pending_cart_item');
          if (rawPending) {
            try {
              const pending = JSON.parse(rawPending);
              sessionStorage.removeItem('jiivaa_pending_cart_item');
              if (pending && pending.productId) {
                setTimeout(async () => {
                  await useCartStore.getState().addItem({
                    productId: pending.productId,
                    variantId: pending.variantId || null,
                    name: pending.name || pending.productName || 'Boutique Product',
                    productName: pending.productName || pending.name || 'Boutique Product',
                    productSlug: pending.productSlug,
                    variantName: pending.variantName || null,
                    size: pending.size || null,
                    color: pending.color || null,
                    sku: pending.sku || pending.productId,
                    price: Number(pending.price || 0),
                    compareAtPrice: pending.compareAtPrice ? Number(pending.compareAtPrice) : null,
                    quantity: pending.quantity || 1,
                    availableStock: pending.availableStock || 99,
                    image: pending.image,
                    shopId: pending.shopId || 'navya-boutique',
                    shopName: pending.shopName || 'Navya Collection Boutique',
                    shopSlug: pending.shopSlug || 'navya-collection',
                    shopLogo: pending.shopLogo,
                  });

                  if (pending.buyNow) {
                    window.location.href = '/checkout';
                  }
                }, 350);
              }
            } catch (err) {
              console.warn('Failed to restore pending cart item:', err);
            }
          }
        }
      }
    } else {
      hasMergedRef.current = false;
      if (wasAuthRef.current) {
        wasAuthRef.current = false;
        useCartStore.getState().resetLocalCart();
        useWishlistStore.getState().resetLocalWishlist();
      } else {
        useCartStore.getState().setGuestMode(true);
        useWishlistStore.getState().setGuestMode(true);
      }
    }
  }, [isAuthenticated, isLoading]);

  return <>{children}</>;
}
