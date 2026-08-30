import { BellRing, Database, Eye, Lock, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'Privacy Policy | Navya Collection Marketplace',
  description:
    'Comprehensive Privacy Policy of Navya Collection multi-vendor marketplace in compliance with the Digital Personal Data Protection (DPDP) Act 2023 and Information Technology Act 2000.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              DPDP Act 2023 & IT Act Compliant
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Last Updated: August 30, 2026 | Effective Date: August 30, 2026
            </p>
          </div>

          {/* Policy Body */}
          <div className="space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-600" />
                1. Overview & Commitment
              </h2>
              <p>
                Navya Collection (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or
                &quot;Platform&quot;) operates the multi-vendor e-commerce marketplace at{' '}
                <strong className="text-navy">navyacollection.store</strong>. We are committed to
                protecting your personal data and privacy in full compliance with the Digital
                Personal Data Protection (DPDP) Act, 2023, Information Technology Act, 2000, and
                Consumer Protection (E-Commerce) Rules, 2020.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600" />
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-navy">Customer Account Information:</strong> Full name,
                  verified mobile phone number, email address, shipping and billing addresses.
                </li>
                <li>
                  <strong className="text-navy">Merchant / Seller Information:</strong> Shop
                  business name, owner name, business email, contact number, pickup warehouse
                  address, GSTIN (where applicable), PAN, and bank payout credentials.
                </li>
                <li>
                  <strong className="text-navy">Transactional & Logistics Data:</strong> Order
                  history, SKU purchased, payment mode (Prepaid via Razorpay or Cash on Delivery),
                  AWB tracking numbers, and delivery confirmation records.
                </li>
                <li>
                  <strong className="text-navy">Device & Security Logs:</strong> IP address, browser
                  type, device identifiers, and security event logs to safeguard against fraud and
                  CSRF attacks.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                3. Payment Information Security
              </h2>
              <p>
                Navya Collection does <strong className="text-navy">NOT</strong> store your raw
                debit card, credit card, net banking credentials, or UPI PINs on our servers. All
                digital payments are processed through RBI-authorized payment aggregators (such as
                Razorpay) utilizing 256-bit SSL encryption and PCI-DSS Level 1 compliance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600" />
                4. Purpose of Data Processing
              </h2>
              <p>We process your personal information exclusively for:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Processing and fulfilling multi-seller marketplace orders.</li>
                <li>
                  Transmitting real-time order confirmation, dispatch updates, and OTPs via
                  transactional SMS, Email (Brevo), and WhatsApp.
                </li>
                <li>Facilitating reverse logistics, returns, and refunds.</li>
                <li>
                  Complying with statutory Tax Collected at Source (TCS) and GST obligations under
                  Indian tax laws.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">5. Third-Party Service Providers</h2>
              <p>
                We share only minimum necessary data with trusted logistics partners (e.g.
                Shiprocket), payment gateways (Razorpay), and transactional communication gateways
                (Brevo / MSG91) to fulfill order deliveries. We never sell your personal data to
                third-party advertisers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-navy">6. Your Rights & Data Retention</h2>
              <p>
                You possess the right to access, rectify, or request deletion of your personal
                account information. You may initiate a data export or account closure by writing to
                our Grievance Officer.
              </p>
            </section>

            <section className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <h2 className="text-base font-bold text-navy">7. Grievance Redressal Officer</h2>
              <p className="text-xs text-slate-600">
                In accordance with Rule 5(9) of the Consumer Protection (E-Commerce) Rules, 2020:
              </p>
              <div className="text-xs space-y-1 mt-2 text-slate-800">
                <p>
                  <strong className="text-navy">Name:</strong> Grievance Officer, Navya Collection
                </p>
                <p>
                  <strong className="text-navy">Email:</strong> support@navyacollection.store
                </p>
                <p>
                  <strong className="text-navy">Address:</strong> Navya Collection Headquarters,
                  Karnal, Haryana - 132001, India
                </p>
                <p>
                  <strong className="text-navy">Response Timeline:</strong> Acknowledgment within 48
                  hours; resolution within 30 days.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
