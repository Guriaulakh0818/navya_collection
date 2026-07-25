'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuthStore } from '@/stores';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Account' }]}
          className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
        />
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-3xl text-navy">My Account</h1>
              <p className="text-sm text-slate-600 mt-1">Welcome, {user?.name || 'Guest'}</p>
            </div>
            <Button variant="outline" className="rounded-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/account/orders"
              className="rounded-2xl border border-border bg-white p-6 shadow-premium hover:border-navy transition-colors"
            >
              <h3 className="font-heading text-xl text-navy">Orders</h3>
              <p className="mt-1 text-sm text-slate-600">Track and manage orders</p>
            </Link>
            <Link
              href="/account/addresses"
              className="rounded-2xl border border-border bg-white p-6 shadow-premium hover:border-navy transition-colors"
            >
              <h3 className="font-heading text-xl text-navy">Addresses</h3>
              <p className="mt-1 text-sm text-slate-600">Manage delivery addresses</p>
            </Link>
            <Link
              href="/wishlist"
              className="rounded-2xl border border-border bg-white p-6 shadow-premium hover:border-navy transition-colors"
            >
              <h3 className="font-heading text-xl text-navy">Wishlist</h3>
              <p className="mt-1 text-sm text-slate-600">Saved items</p>
            </Link>
            <Link
              href="/cart"
              className="rounded-2xl border border-border bg-white p-6 shadow-premium hover:border-navy transition-colors"
            >
              <h3 className="font-heading text-xl text-navy">Cart</h3>
              <p className="mt-1 text-sm text-slate-600">Review your cart</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
