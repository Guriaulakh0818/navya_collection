import { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Order Confirmed | Navya Collection',
  description: 'Your order has been placed successfully.',
};

interface PageProps {
  searchParams: { orderNumber?: string };
}

export default function CheckoutSuccessPage({ searchParams }: PageProps) {
  const displayOrderNumber =
    searchParams?.orderNumber || `NC-2026-${Date.now().toString().slice(-6)}`;
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="font-heading text-3xl text-navy">Order Confirmed!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-premium text-left">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Order Number</span>
              <span className="font-semibold text-navy">{displayOrderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Delivery</span>
              <span className="font-semibold text-navy">{estimatedDelivery}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span className="font-semibold text-navy">Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button className="rounded-full" asChild>
            <Link href="/account/orders">View Orders</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
