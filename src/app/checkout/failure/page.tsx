import { AlertOctagon, RefreshCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function PaymentFailurePage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Checkout', href: '/checkout' },
          { label: 'Payment Status' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-xl px-4 md:px-6 py-12 text-center space-y-6">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-xs mb-1">
            <AlertOctagon className="h-10 w-10" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-navy">Payment Not Completed</h1>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            Your payment could not be processed or the transaction window was closed. Don&apos;t
            worry — no money was deducted from your account. You can retry payment immediately.
          </p>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-left space-y-1">
            <p className="font-bold">Possible Reasons:</p>
            <ul className="list-disc list-inside space-y-0.5 font-normal text-amber-700">
              <li>Cancelled by user or bank OTP timeout</li>
              <li>Insufficient bank balance or card limit exceeded</li>
              <li>Network interruption during 3D secure verification</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/checkout">
              <button className="rounded-full bg-navy text-white hover:bg-navy/90 font-bold text-xs px-6 py-2.5 shadow-md transition cursor-pointer flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Retry Payment Now
              </button>
            </Link>

            <Link href="/cart">
              <button className="rounded-full border border-slate-200 text-navy hover:bg-slate-50 font-bold text-xs px-5 py-2.5 shadow-xs transition cursor-pointer flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Return to Cart
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
