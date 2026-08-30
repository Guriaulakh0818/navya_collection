import { Box, Clock, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Shipping & Logistics Policy | Navya Collection',
  description:
    'Shipping rates, delivery timelines, multi-seller fulfillment, and tracking information for Navya Collection marketplace orders.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Shipping Policy' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
              <Truck className="w-4 h-4 text-amber-600" />
              Pan-India Express Logistics
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Fast, reliable delivery powered by Shiprocket across 19,000+ pin codes in India.
            </p>
          </div>

          {/* Delivery Timelines Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-navy text-sm">Metro &amp; Tier 1 Cities</h3>
              <p className="text-xs text-slate-600 font-medium">
                2 to 4 Business Days (Delhi NCR, Mumbai, Bengaluru, etc.)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-navy text-sm">Tier 2 &amp; Regional Hubs</h3>
              <p className="text-xs text-slate-600 font-medium">
                4 to 6 Business Days across State Capitals and major districts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-navy text-sm">Remote &amp; Rural Zones</h3>
              <p className="text-xs text-slate-600 font-medium">
                5 to 7 Business Days with live SMS &amp; WhatsApp AWB tracking.
              </p>
            </div>
          </div>

          {/* Policy Body */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                1. Shipping Charges &amp; Free Delivery
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-navy">Orders above ₹999:</strong> 100% Free Express
                  Delivery across India.
                </li>
                <li>
                  <strong className="text-navy">Orders below ₹999:</strong> Nominal flat shipping
                  fee of ₹99 per order.
                </li>
                <li>
                  <strong className="text-navy">Cash on Delivery (COD):</strong> Available with zero
                  hidden handling surcharges.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-600" />
                2. Multi-Seller Fulfillment &amp; Split Shipments
              </h2>
              <p>
                Navya Collection is a multi-vendor marketplace. If your cart contains items from
                multiple boutique stores (e.g. Saniya Fashions and another boutique), each merchant
                dispatches their product directly from their verified warehouse location.
              </p>
              <p className="text-xs text-slate-600">
                You will receive individual Airway Bill (AWB) tracking links for each split
                consignment at no extra shipping cost to you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                3. Order Tracking
              </h2>
              <p>
                Once an item is dispatched, you will receive an SMS and WhatsApp notification
                containing your Shiprocket tracking number. You can also track your live shipment
                anytime from the{' '}
                <Link href="/account/orders" className="text-amber-700 font-bold underline">
                  Order History
                </Link>{' '}
                dashboard.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
