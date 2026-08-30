import { AlertCircle, CheckCircle2, FileText, Scale, ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Navya Collection Marketplace',
  description:
    'Terms of Use and Conditions governing the Navya Collection multi-vendor fashion marketplace for buyers and merchant sellers.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              Marketplace Terms of Service
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Last Updated: August 30, 2026 | Effective Date: August 30, 2026
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                1. Acceptance of Terms
              </h2>
              <p>
                Welcome to Navya Collection (
                <strong className="text-navy">navyacollection.store</strong>). By registering an
                account, purchasing products, or operating a merchant seller store on this Platform,
                you agree to be bound by these Terms and Conditions and all applicable laws and
                regulations of the Republic of India.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                2. Marketplace Intermediary Role
              </h2>
              <p>
                Navya Collection operates as an e-commerce marketplace platform connecting
                independent boutique merchants and textile manufacturers (&quot;Sellers&quot;) with
                retail consumers (&quot;Buyers&quot;).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  Sellers are independent business entities responsible for manufacturing, listing
                  accuracy, inventory reservation, and dispatching genuine garments.
                </li>
                <li>
                  All products undergo quality verification checks and automated SKU tracking before
                  listing approval.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                3. Order Placement, Pricing &amp; Offline-Online Protection
              </h2>
              <p>
                When a Buyer places an order, an automated order confirmation is transmitted. For
                physical boutique stores with concurrent walk-in customers:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  Sellers have a 24-hour window to review and confirm warehouse stock availability.
                </li>
                <li>
                  In the unlikely event of concurrent offline stock exhaustion, the order is
                  promptly notified, cancelled, and 100% of any prepaid amount is immediately
                  refunded.
                </li>
                <li>
                  All listed prices are in Indian Rupees (INR) and inclusive of applicable GST
                  unless explicitly stated otherwise.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                4. Payment Methods &amp; COD Verification
              </h2>
              <p>
                We accept major digital payment methods (UPI, Cards, Net Banking) via Razorpay as
                well as Cash on Delivery (COD) across eligible pin codes. For COD orders, OTP mobile
                verification is mandatory to prevent unauthorized bookings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">5. Intellectual Property</h2>
              <p>
                All trademarks, logos, UI designs, and software algorithms on navyacollection.store
                are the exclusive intellectual property of Navya Collection. Unsanctioned scraping,
                unauthorized listing cloning, or reverse engineering is strictly prohibited.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">6. Governing Law &amp; Jurisdiction</h2>
              <p>
                These Terms shall be governed by and interpreted in accordance with the laws of
                India. Any disputes arising out of transactions on this Platform shall be subject to
                the exclusive jurisdiction of the competent courts in Karnal, Haryana.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
