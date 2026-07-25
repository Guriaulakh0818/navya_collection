'use client';

import { useState } from 'react';
import Link from 'next/link';

import { MiniCartDrawer } from '@/features/cart/components/MiniCartDrawer';
import { useAuthStore, useCartStore, useWishlistStore } from '@/stores';

type HeaderActionsProps = {
  className?: string;
};

export function HeaderActions({ className }: HeaderActionsProps) {
  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={className || 'flex items-center gap-1 sm:gap-2 shrink-0'}>
      <Link
        href="/wishlist"
        className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-700 hover:text-navy hover:bg-slate-100 transition-colors"
        aria-label="Wishlist"
        title="Wishlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06 1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {wishlistItems.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white shadow-sm">
            {wishlistItems.length}
          </span>
        )}
      </Link>

      <button
        onClick={() => setIsCartOpen(true)}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-700 hover:text-navy hover:bg-slate-100 transition-colors"
        aria-label="Cart"
        title="Shopping Cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white shadow-sm">
            {cartCount}
          </span>
        )}
      </button>

      <Link
        href={user ? '/account' : '/login'}
        className="inline-flex items-center justify-center rounded-full p-2 text-slate-700 hover:text-navy hover:bg-slate-100 transition-colors"
        aria-label="Account"
        title={user ? user.name || 'Account' : 'Login / Register'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>

      <MiniCartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
