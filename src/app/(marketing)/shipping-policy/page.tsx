import { Box, Clock, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: `Shipping Policy & Delivery Information | ${SEO_CONSTANTS.SITE_NAME}`,
  description:
    'Shipping rates, delivery timelines, multi-seller fulfillment, and tracking information for Navya Collection marketplace orders across India.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/shipping-policy`,
  },
  openGraph: {
    title: `Shipping Policy & Delivery Information | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Shipping rates, delivery timelines, multi-seller fulfillment, and tracking information for Navya Collection marketplace orders across India.',
    url: `${SEO_CONSTANTS.SITE_URL}/shipping-policy`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
  },
};

export default function ShippingPolicyPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONSTANTS.SITE_URL },
    { name: 'Shipping Policy', url: `${SEO_CONSTANTS.SITE_URL}/shipping-policy` },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumb Structured Data */}
      <JsonLd data={breadcrumbSchema} />
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
                1. Shipping Charges &amp; Free Delivery Policy
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-navy">Seller-Level Free Shipping Threshold:</strong> Free
                  shipping is available when the selling-price subtotal for a seller&apos;s shipment
                  is ₹999 or more. In a multi-seller order, the ₹999 threshold is calculated
                  separately for each seller because products are dispatched directly from each
                  seller&apos;s warehouse.
                </li>
                <li>
                  <strong className="text-navy">Standard Shipping:</strong> For seller shipments
                  with a subtotal below ₹999, an applicable standard shipping charge of ₹49 applies
                  per seller shipment.
                </li>
                <li>
                  <strong className="text-navy">Express &amp; Same Day Options:</strong> Where
                  available, Express delivery (₹99) and Same Day delivery (₹149, free on seller
                  shipments ₹1,999+) may be selected during checkout.
                </li>
                <li>
                  <strong className="text-navy">Cash on Delivery (COD):</strong> Available across
                  serviceable pin codes at standard rates with zero hidden surcharges.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-600" />
                2. Multi-Seller Fulfillment &amp; Independent Vendor Shipments
              </h2>
              <p>
                Navya Collection is a curated designer marketplace. If your cart contains items from
                multiple boutique partners, each seller prepares and dispatches their package
                independently from their registered hub.
              </p>
              <p className="text-xs text-slate-600">
                Because each seller ships independently, shipping is assessed on a per-seller
                shipment basis. Each shipment receives its own discrete Airway Bill (AWB) and live
                tracking link.
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
