import { AlertTriangle, CheckCircle2, Clock, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Order Cancellation Policy | Navya Collection',
  description:
    'Guidelines, timelines, and refund procedures for order cancellations before and after dispatch on Navya Collection.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Cancellation Policy' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3">
              <XCircle className="w-4 h-4 text-rose-600" />
              Order Cancellation Guidelines
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Cancellation Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Last Updated: August 30, 2026 | Effective Date: August 30, 2026
            </p>
          </div>

          {/* Key Cancellation Windows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Before Order Dispatch (Free &amp; Instant)
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                You can cancel your order directly from your{' '}
                <Link href="/account/orders" className="underline font-bold">
                  My Orders
                </Link>{' '}
                dashboard at zero fee anytime before the merchant packs and generates the courier
                AWB label. 100% of your prepaid amount is refunded immediately.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                After Order Dispatch (In-Transit)
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                Once a consignment is handed over to the courier partner
                (Shiprocket/Delhivery/Bluedart), in-app cancellation is locked. You may decline
                delivery at doorstep upon courier arrival, and a refund will trigger upon package
                return.
              </p>
            </div>
          </div>

          {/* Detailed Policy Body */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                1. Seller Order Acceptance Window &amp; Auto-Cancellation Rule
              </h2>
              <p>
                Navya Collection protects buyers from out-of-stock scenarios. When you place an
                order with an independent boutique merchant:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  The boutique seller is granted a <strong>24-hour verification window</strong> to
                  confirm warehouse stock.
                </li>
                <li>
                  If the physical shop experiences concurrent in-store stock exhaustion and fails to
                  confirm dispatch within 24 hours, the order is{' '}
                  <strong>automatically cancelled</strong> by the platform system.
                </li>
                <li>
                  100% of your prepaid money is immediately returned to your source payment account
                  with automated notification.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                2. Refund Processing Timelines
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-navy">
                    UPI / Net Banking / Debit Card / Credit Card:
                  </strong>{' '}
                  Initiated automatically within 24 hours of cancellation. Credit reflects in your
                  bank statement in 3 to 5 business days per banking settlement cycles.
                </li>
                <li>
                  <strong className="text-navy">Cash on Delivery (COD) Orders:</strong> Zero payment
                  deduction was made, so no refund is necessary. Your order status simply updates to
                  &quot;Cancelled&quot;.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                3. Cancellation of Custom Tailored Items
              </h2>
              <p className="text-xs sm:text-sm">
                Orders involving custom measurements, specialized blouse stitching, or
                tailor-altered lehengas cannot be cancelled once the fabric cutting or stitching
                process has begun. Please reach out to customer support immediately if modifications
                are required.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
