import { CheckCircle2, Clock, RefreshCw, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Return, Replacement & Refund Policy | Navya Collection',
  description:
    '7-Day hassle-free return and replacement policy for Navya Collection multi-vendor fashion marketplace.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Return & Refund Policy' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              7-Day Buyer Protection Guarantee
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Return, Replacement &amp; Refund Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Transparent, fair, and reliable returns for all clothing and ethnic fashion orders.
            </p>
          </div>

          {/* Key Return Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-navy text-sm">7-Day Window</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Initiate return or size exchange within 7 days of package delivery.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Truck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-navy text-sm">Doorstep Reverse Pickup</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Free automated reverse pickup across 19,000+ Indian pincodes.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-navy text-sm">Instant Refund / Credit</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Refund processed to original payment method or bank account in 3-5 days.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">1. Return Eligibility Criteria</h2>
              <p>Items are eligible for return or size exchange if:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Eligible for Return
                  </div>
                  <ul className="text-xs text-emerald-900 space-y-1 pl-5 list-disc">
                    <li>Size mismatch or incorrect fit</li>
                    <li>Defective, damaged, or torn fabric received</li>
                    <li>Incorrect product or color variation dispatched</li>
                    <li>Unused garments with original tags and packaging intact</li>
                  </ul>
                </div>

                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Non-Returnable Items
                  </div>
                  <ul className="text-xs text-rose-900 space-y-1 pl-5 list-disc">
                    <li>Custom tailored / altered outfits per buyer instructions</li>
                    <li>Used, washed, perfume-sprayed, or soiled clothing</li>
                    <li>Items returned after the 7-day delivery window</li>
                    <li>Intimate apparel or hygiene-sensitive items</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">2. How to Request a Return</h2>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  Log in to your account and navigate to{' '}
                  <Link href="/account/orders" className="text-amber-700 font-bold underline">
                    My Orders
                  </Link>
                  .
                </li>
                <li>
                  Select the delivered order and click{' '}
                  <strong>&quot;Request Return / Exchange&quot;</strong>.
                </li>
                <li>
                  Select the reason (e.g. Size Exchange, Quality issue) and attach clear photos if
                  damaged.
                </li>
                <li>
                  Our logistics team will schedule a doorstep reverse pickup within 24-48 hours.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">3. Refund Timelines &amp; Modes</h2>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong className="text-navy">Prepaid Orders (UPI/Cards/Netbanking):</strong>{' '}
                  Refund is initiated automatically to the original source method within 24 hours of
                  warehouse quality check. Banks typically reflect credit in 3–5 business days.
                </li>
                <li>
                  <strong className="text-navy">Cash on Delivery (COD) Orders:</strong> You will be
                  prompted to enter your Bank Account / UPI ID for direct IMPS transfer once pickup
                  is verified.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
