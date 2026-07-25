'use client';

import { ChevronRight, Heart, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { useAuthStore, useCartStore, useWishlistStore } from '@/stores';

import { HeaderSearch } from './HeaderSearch';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const [gentsOpen, setGentsOpen] = useState(false);
  const [kidsOpen, setKidsOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 bg-navy text-white flex items-center justify-between">
          <div>
            <span className="font-heading text-lg font-bold">NAVYA</span>
            <span className="block text-[10px] tracking-widest text-orange uppercase font-semibold">
              Collection
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <HeaderSearch className="w-full" />
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Link
            href="/"
            onClick={onClose}
            className="block py-2 text-sm font-bold text-slate-800 hover:text-navy"
          >
            Home
          </Link>

          {/* Gents Accordion */}
          <div className="border-b border-slate-100 pb-2">
            <button
              onClick={() => setGentsOpen(!gentsOpen)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800"
            >
              <span>Gents Collection</span>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform ${gentsOpen ? 'rotate-90 text-navy' : ''}`}
              />
            </button>
            {gentsOpen && (
              <div className="pl-4 py-2 space-y-2 text-xs text-slate-600 bg-slate-50 rounded-xl">
                <Link
                  href="/shop?category=gents&sub=Shirts"
                  onClick={onClose}
                  className="block hover:text-orange"
                >
                  Shirts (Casual & Formal)
                </Link>
                <Link
                  href="/shop?category=gents&sub=Kurtas"
                  onClick={onClose}
                  className="block hover:text-orange"
                >
                  Ethnic Kurtas
                </Link>
                <Link
                  href="/shop?category=gents&sub=Trousers"
                  onClick={onClose}
                  className="block hover:text-orange"
                >
                  Chinos & Trousers
                </Link>
                <Link
                  href="/shop?category=gents&sub=Blazers"
                  onClick={onClose}
                  className="block hover:text-orange"
                >
                  Blazers & Suits
                </Link>
              </div>
            )}
          </div>

          {/* Kids Accordion */}
          <div className="border-b border-slate-100 pb-2">
            <button
              onClick={() => setKidsOpen(!kidsOpen)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800"
            >
              <span>Kids Wear</span>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform ${kidsOpen ? 'rotate-90 text-orange' : ''}`}
              />
            </button>
            {kidsOpen && (
              <div className="pl-4 py-2 space-y-2 text-xs text-slate-600 bg-slate-50 rounded-xl">
                <Link
                  href="/shop?category=kids&sub=Boys"
                  onClick={onClose}
                  className="block hover:text-navy"
                >
                  Boys Wear (T-Shirts, Sets)
                </Link>
                <Link
                  href="/shop?category=kids&sub=Girls"
                  onClick={onClose}
                  className="block hover:text-navy"
                >
                  Girls Wear (Dresses, Frocks)
                </Link>
                <Link
                  href="/shop?category=kids&sub=Infants"
                  onClick={onClose}
                  className="block hover:text-navy"
                >
                  Infant & Toddler Sets
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/shop?filter=new"
            onClick={onClose}
            className="flex items-center gap-2 py-2 text-sm font-bold text-slate-800 hover:text-navy"
          >
            <Sparkles className="h-4 w-4 text-orange" /> New Arrivals
          </Link>

          <Link
            href="/shop?filter=offers"
            onClick={onClose}
            className="block py-2 text-sm font-bold text-orange hover:text-orange-hover"
          >
            Special Offers & Sales
          </Link>

          <Link
            href="/shop"
            onClick={onClose}
            className="block py-2 text-sm font-bold text-slate-800 hover:text-navy"
          >
            Browse Full Shop
          </Link>
        </div>

        {/* Footer User Quick Nav */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
          <Link
            href={user ? '/account' : '/login'}
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
          >
            <User className="h-4 w-4 text-navy" />
            <span>{user ? `Account (${user.name})` : 'Login / Register'}</span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/wishlist"
              onClick={onClose}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <Heart className="h-4 w-4 text-red-500" /> Wishlist ({wishlistItems.length})
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <ShoppingBag className="h-4 w-4 text-orange" /> Cart ({cartItems.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
