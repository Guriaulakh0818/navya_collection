import { Heart, HelpCircle, ShieldCheck, Sparkles, Store, Truck, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { generateBreadcrumbSchema, JsonLd, SEO_CONSTANTS } from '@/frontend/features/seo';

export const metadata: Metadata = {
  title: `About Us | ${SEO_CONSTANTS.SITE_NAME}`,
  description:
    'Learn about Navya Collection — a fashion marketplace connecting customers across India with verified local clothing stores, designer boutiques, and regional fashion creators.',
  alternates: {
    canonical: `${SEO_CONSTANTS.SITE_URL}/about`,
  },
  openGraph: {
    title: `About Us | ${SEO_CONSTANTS.SITE_NAME}`,
    description:
      'Learn about Navya Collection — a fashion marketplace connecting customers across India with verified local clothing stores, designer boutiques, and regional fashion creators.',
    url: `${SEO_CONSTANTS.SITE_URL}/about`,
    siteName: SEO_CONSTANTS.SITE_NAME,
    locale: SEO_CONSTANTS.DEFAULT_LOCALE,
    type: 'website',
  },
};

export default function AboutPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONSTANTS.SITE_URL },
    { name: 'About Us', url: `${SEO_CONSTANTS.SITE_URL}/about` },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumb Structured Data */}
      <JsonLd data={breadcrumbSchema} />

      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-12">
        {/* Hero Banner with Direct Entity Definition */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Fashion Marketplace for Local Stores
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-navy tracking-tight max-w-2xl mx-auto leading-tight">
            Connecting Local Clothing Boutiques with India.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Navya Collection is an online marketplace dedicated to bringing independent fashion
            boutiques, regional apparel creators, and local clothing stores onto a unified digital
            platform, delivering authentic fashion straight to your doorstep across India.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">Local Store Empowerment</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We empower physical boutique owners and creators to showcase their unique collections
              online and expand their reach beyond neighborhood boundaries.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">Transparent Marketplace</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every product listing clearly displays the seller storefront, transparent pricing,
              genuine customer feedback, and real inventory availability.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">Pan-India Delivery</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Integrated with Shiprocket logistics to deliver safely across 19,000+ pin codes with
              automated AWB tracking and doorstep reverse pickups.
            </p>
          </div>
        </div>

        {/* Mission & Seller Community */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-navy to-[#1e3a8a] text-white rounded-3xl p-8 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Heart className="w-4 h-4 fill-amber-400" /> Our Vision
            </div>
            <h2 className="font-heading text-2xl font-extrabold">Decentralized Fashion Access</h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              To build a trustworthy fashion ecosystem where boutique entrepreneurs flourish,
              artisans receive fair compensation, and consumers discover one-of-a-kind regional
              attire for festivals, weddings, and daily wear.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition-all cursor-pointer"
              >
                Browse Marketplace Collections &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
              <Users className="w-4 h-4" /> Partner Network
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-navy">
              Sell on Navya Collection
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you a boutique merchant, ethnic wear creator, or garment manufacturer in India?
              Expand your brand with automated order management, zero upfront registration fees, and
              integrated shipping support.
            </p>
            <div className="pt-2">
              <Link
                href="/become-seller"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                Register Your Boutique &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Quick FAQ Link */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-sm sm:text-base">Have more questions about Navya?</h3>
              <p className="text-xs text-slate-600">Read our comprehensive FAQ covering orders, shipping, and seller onboarding.</p>
            </div>
          </div>
          <Link
            href="/faq"
            className="px-5 py-2.5 bg-navy hover:bg-navy/90 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition-all"
          >
            View Frequently Asked Questions &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
