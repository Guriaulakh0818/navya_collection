'use client';

import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { ORDERS } from '@/features/orders/constants/orders.constants';
import type { Order } from '@/features/orders/types/orders.types';

const STATUS_STYLE: Record<Order['status'], string> = {
  Delivered: 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700',
  Shipped: 'rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700',
  Processing: 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700',
  'Out for Delivery': 'rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700',
  Cancelled: 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700',
};

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'My Orders' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h2 className="font-heading text-2xl text-navy mb-6">My Orders</h2>

        {ORDERS.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
            <p className="text-sm text-slate-600">
              No orders yet. Start shopping to see your orders here.
            </p>
            <Link href="/shop">
              <Button className="mt-4 rounded-full">Shop Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ORDERS.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-600">{order.items.length} item(s)</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy">
                      ₹{order.total.toLocaleString('en-IN')}
                    </p>
                    <span className={STATUS_STYLE[order.status]}>{order.status}</span>
                  </div>

                  <Button variant="outline" className="rounded-full" asChild>
                    <Link href={`/account/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
