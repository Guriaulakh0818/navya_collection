import {
  Building2,
  CheckCircle2,
  FileText,
  IndianRupee,
  Percent,
  Scale,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: 'Seller Marketplace Agreement & Terms',
  description:
    'Standard Merchant Terms and Conditions, Commission Slabs, Payout Schedules (T+7), Statutory Tax Deductions (TCS & TDS), and Seller Responsibilities on JiivaaKart.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/seller-agreement`,
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  openGraph: {
    title: `Seller Marketplace Agreement & Terms | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Standard Merchant Terms and Conditions, Commission Slabs, Payout Schedules (T+7), Statutory Tax Deductions (TCS & TDS), and Seller Responsibilities on JiivaaKart.',
    url: `${SEO_CONSTANTS.SITE_URL}/seller-agreement`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
    images: [
      {
        url: SEO_CONSTANTS.DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `Seller Agreement - ${SEO_CONSTANTS.SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Seller Marketplace Agreement & Terms | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Standard Merchant Terms and Conditions, Commission Slabs, Payout Schedules (T+7), Statutory Tax Deductions (TCS & TDS), and Seller Responsibilities on JiivaaKart.',
    images: [SEO_CONSTANTS.DEFAULT_OG_IMAGE],
  },
};

export default function SellerAgreementPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONSTANTS.SITE_URL },
    { name: 'Seller Agreement', url: `${SEO_CONSTANTS.SITE_URL}/seller-agreement` },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Seller Agreement' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              Merchant Partner Legal Contract
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Seller Marketplace Agreement
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Applicable to all boutique owners, manufacturers, and merchants onboarding onto
              JiivaaKart.
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Percent className="w-5 h-5 text-orange" />
              <h3 className="font-bold text-navy text-sm">10% Platform Commission</h3>
              <p className="text-[11px] text-slate-600">
                Standard marketplace service fee (+ 18% GST on commission) upon successful delivery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-navy text-sm">Weekly T+7 Payouts</h3>
              <p className="text-[11px] text-slate-600">
                Direct NEFT/RTGS bank transfer to your verified account 7 days post-delivery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-navy text-sm">Doorstep Courier Pickup</h3>
              <p className="text-[11px] text-slate-600">
                Integrated Shiprocket courier pickup from your shop address across India.
              </p>
            </div>
          </div>

          {/* Contract Clauses */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange" />
                1. Seller Onboarding, KYC &amp; Documentation
              </h2>
              <p>To operate a storefront on JiivaaKart, the merchant must provide:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li>Valid Business PAN (or Proprietor PAN).</li>
                <li>
                  GSTIN Registration certificate (or official declaration of exemption under ₹40
                  Lakh intra-state limit).
                </li>
                <li>
                  Cancelled cheque / verified bank account details with matching legal entity name
                  for weekly payouts.
                </li>
                <li>
                  Physical shop pickup address with contact person and mobile number for Shiprocket
                  AWB manifest creation.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-orange" />
                2. Invoicing, Commission &amp; Tax Deductions (GST TCS &amp; TDS 194-O)
              </h2>
              <p>
                In accordance with Indian tax statutes and Section 52 of the CGST Act (amended via
                Notification 15/2024) &amp; Section 194-O of the Income Tax Act:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <p>
                  <strong className="text-navy">Product Tax Invoice (Seller &rarr; Buyer):</strong>{' '}
                  The seller issues the retail tax invoice for apparel goods (charging 5% GST for
                  items &lt; ₹1,000 and 12% GST for items &ge; ₹1,000).
                </p>
                <p>
                  <strong className="text-navy">
                    Commission Invoice (JiivaaKart &rarr; Seller):
                  </strong>{' '}
                  JiivaaKart issues a monthly service invoice for the 10% platform fee + 18% GST on
                  the service fee.
                </p>
                <p>
                  <strong className="text-navy">GST TCS (Section 52):</strong> 0.5% GST TCS is
                  deducted on net taxable sales and deposited in GSTR-8 for seller input credit.
                </p>
                <p>
                  <strong className="text-navy">Income Tax TDS (Section 194-O):</strong> 0.1% TDS is
                  deducted on gross sales amount (with statutory exemption for individual sellers
                  under ₹5 Lakh annual turnover with PAN).
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange" />
                3. Order Fulfillment, Dispatch SLA &amp; Inventory Rules
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong className="text-navy">24-Hour Confirmation Window:</strong> The seller
                  must accept orders and verify physical stock availability within 24 hours of
                  placement to prevent out-of-stock overselling.
                </li>
                <li>
                  <strong className="text-navy">Packaging Standard:</strong> Apparel must be
                  packaged securely in tamper-evident polybags or boxes with clear printed AWB
                  shipping labels affixed.
                </li>
                <li>
                  <strong className="text-navy">Authenticity Guarantee:</strong> Sellers warrant
                  that all fabrics, lehengas, sarees, and garments are 100% genuine and match the
                  product photos and description accurately. Counterfeit items result in immediate
                  merchant ban and forfeiture of pending balances.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Scale className="w-5 h-5 text-orange" />
                4. Customer Returns vs. RTO Logistics Policy
              </h2>
              <p className="text-xs sm:text-sm">
                <strong>Approved Customer Returns:</strong> If a customer initiates a return within
                the approved return window, the item is routed back to the seller. JiivaaKart
                reverses its 10% commission and customer refund is issued. Actual logistics freight
                liability is handled according to our standard seller return policy.
              </p>
              <p className="text-xs sm:text-sm">
                <strong>RTO (Return to Origin / Undelivered Consignments):</strong> When a shipment
                cannot be delivered to the customer and is returned to the seller as RTO, the actual
                eligible logistics cost is shared equally: <strong>50% borne by JiivaaKart</strong>{' '}
                and <strong>50% borne by the seller</strong> via an adjustment ledger entry.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
