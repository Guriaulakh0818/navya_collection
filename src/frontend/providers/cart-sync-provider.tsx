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
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const hasMergedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (!hasMergedRef.current) {
        hasMergedRef.current = true;

        // Perform guest merge on login
        cartStore.setGuestMode(false);
        wishlistStore.setGuestMode(false);

        cartStore.mergeGuestCart();
        wishlistStore.mergeGuestWishlist();
      }
    } else {
      hasMergedRef.current = false;
      cartStore.setGuestMode(true);
      wishlistStore.setGuestMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  return <>{children}</>;
}
