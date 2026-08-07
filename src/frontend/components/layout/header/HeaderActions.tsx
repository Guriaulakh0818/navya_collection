'use client';

import {
  Building2,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore, useCartStore, useWishlistStore } from '@/stores';

const MiniCartDrawer = dynamic(
  () => import('@/features/cart/components/MiniCartDrawer').then((m) => m.MiniCartDrawer),
  { ssr: false },
);

type HeaderActionsProps = {
  className?: string;
};

export function HeaderActions({ className }: HeaderActionsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { user: authUser } = useAuth();
  const storeUser = useAuthStore((s) => s.user);
  const user = isMounted ? authUser || storeUser : null;

  const cartItems = useCartStore((s) => s.items);
  const wishlistItems = useWishlistStore((s) => s.items);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSellerMenuOpen, setIsSellerMenuOpen] = useState(false);

  const cartCount = isMounted ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount = isMounted ? wishlistItems.length : 0;

  // Check if user is a verified seller or admin/owner on the platform
  const userRole = String(user?.role || '').toUpperCase();
  const isVerifiedSeller = Boolean(
    isMounted && user && ['SELLER', 'OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole),
  );

  const shopName =
    (user as any)?.shopName ||
    (user as any)?.shop?.name ||
    (userRole === 'OWNER' ? 'Navya Collection' : 'Merchant Store');

  return (
    <div
      className={
        className || 'flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0 flex-nowrap min-w-0'
      }
    >
      {/* Wishlist Heart Icon (Positioned directly on the left of Cart icon) */}
      <Link
        href="/wishlist"
        className="relative inline-flex items-center justify-center rounded-full p-1.5 xs:p-2 text-slate-700 hover:text-rose-600 hover:bg-rose-50/60 transition-colors active:scale-95 shrink-0"
        aria-label="Wishlist"
        title="Wishlist"
      >
        <Heart className="h-5 w-5 sm:h-5 sm:w-5 text-slate-700 hover:text-rose-600 transition-colors" />
        {wishlistCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-extrabold text-white shadow-xs">
            {wishlistCount}
          </span>
        )}
      </Link>

      {/* Cart Icon (Positioned directly to the right of Wishlist Heart) */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative inline-flex items-center justify-center rounded-full p-1.5 xs:p-2 text-slate-700 hover:text-navy hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer shrink-0"
        aria-label="Cart"
        title="Shopping Cart"
      >
        <ShoppingCart className="h-5 w-5 sm:h-5 sm:w-5 text-slate-700 hover:text-navy transition-colors" />
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-extrabold text-white shadow-xs">
            {cartCount}
          </span>
        )}
      </button>

      {/* Notification Bell */}
      {isMounted && <NotificationBell userId={user?.id} />}

      {/* VERIFIED SELLER BOUTIQUE BOX OR BECOME SELLER LINK */}
      {isVerifiedSeller ? (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsSellerMenuOpen(!isSellerMenuOpen)}
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 p-1.5 xs:p-2 sm:px-3 sm:py-1.5 text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer"
            title={`Verified Store: ${shopName}`}
          >
            <Store className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline truncate max-w-[90px] md:max-w-[110px] xl:max-w-[130px] font-bold">
              {shopName}
            </span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 shrink-0" />
          </button>

          {/* Seller Dashboard Quick Access Dropdown Menu */}
          {isSellerMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              onMouseLeave={() => setIsSellerMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-amber-50/50 rounded-xl">
                <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                  Verified Store
                </p>
                <p className="text-xs font-bold text-navy truncate mt-0.5">{shopName}</p>
              </div>

              <Link
                href="/seller/dashboard"
                onClick={() => setIsSellerMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-navy hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-600" />
                <span>Seller Dashboard</span>
              </Link>

              <Link
                href="/seller/products"
                onClick={() => setIsSellerMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <Package className="w-4 h-4 text-amber-600" />
                <span>Inventory & Stock</span>
              </Link>

              <Link
                href="/seller/orders"
                onClick={() => setIsSellerMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Manage Orders</span>
              </Link>

              <Link
                href="/seller/analytics"
                onClick={() => setIsSellerMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Sales Analytics</span>
              </Link>

              <Link
                href="/seller/shop"
                onClick={() => setIsSellerMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors border-t border-slate-100 mt-1 pt-2"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Shop Profile & Settings</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/become-seller"
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange/10 border border-amber-500/30 text-amber-700 hover:text-navy hover:bg-amber-100 p-1.5 xs:p-2 sm:px-3 sm:py-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs whitespace-nowrap shrink-0"
        >
          <Store className="w-4 h-4 text-amber-600 sm:hidden shrink-0" />
          <span className="hidden sm:inline">Become Seller ✨</span>
        </Link>
      )}

      {/* Account / Login Pill Button */}
      {isMounted && user ? (
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 p-1.5 xs:p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-navy hover:bg-slate-200 transition-colors active:scale-95 shadow-xs shrink-0"
          title={user.name || user.email || 'Account'}
        >
          <UserIcon className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="hidden sm:inline truncate max-w-[85px] md:max-w-[100px] xl:max-w-[120px]">
            {user.name || (user.email ? user.email.split('@')[0] : 'Account')}
          </span>
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-navy text-white hover:bg-navy/90 p-1.5 xs:px-3 sm:px-4 sm:py-1.5 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
        >
          <UserIcon className="w-4 h-4 text-white sm:hidden shrink-0" />
          <span className="hidden sm:inline">Login</span>
        </Link>
      )}

      {isCartOpen && <MiniCartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </div>
  );
}
