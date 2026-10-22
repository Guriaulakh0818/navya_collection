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
