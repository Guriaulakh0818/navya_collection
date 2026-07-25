'use client';

import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account', href: '/account' },
            { label: 'Orders' },
          ]}
          className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
        />
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
          <h1 className="font-heading text-3xl text-navy mb-6">My Orders</h1>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
            <p className="text-sm text-slate-600">
              No orders yet. Start shopping to see your orders here.
            </p>
            <Link href="/shop">
              <Button className="mt-4 rounded-full">Shop Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
