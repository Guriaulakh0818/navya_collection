import { Heart, ShieldCheck, Sparkles, Store, Truck, Users } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';

export const metadata: Metadata = {
  title: 'About Us | Navya Collection Multi-Vendor Marketplace',
  description:
    'Discover Navya Collection — India’s curated multi-vendor destination for luxury ethnic wear, handcrafted sarees, bridal couture, gents wear, and festive kids collections.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
        className="mx-auto max-w-5xl px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-5xl px-4 md:px-6 py-8 space-y-12">
        {/* Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Curated Indian Couture Marketplace
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-black text-navy tracking-tight max-w-2xl mx-auto leading-tight">
            Bridging Heritage Artisans &amp; Modern Indian Fashion.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Navya Collection was founded with a singular purpose: to bring authentic regional
            craftsmanship, handcrafted bridal couture, silk sarees, and contemporary festive wear
            directly from verified boutique artisans to families across India.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">Verified Local Boutiques</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every merchant on our marketplace undergoes strict physical store verification and
              fabric quality audits before their storefront goes live.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">
              100% Quality &amp; Fair Pricing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              By connecting customers directly to boutique weavers and creators, we eliminate
              middlemen markups while preserving genuine traditional embroidery.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy">
              Pan-India Express Logistics
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Integrated with tier-1 logistics networks to deliver safely across 19,000+ pin codes
              with live GPS tracking and doorstep reverse pickups.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-navy to-[#1e3a8a] text-white rounded-3xl p-8 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Heart className="w-4 h-4 fill-amber-400" /> Our Mission
            </div>
            <h2 className="font-heading text-2xl font-extrabold">Empowering Local Designers</h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              To build India’s most trustworthy decentralized apparel ecosystem where boutique
              entrepreneurs flourish, artisans receive fair compensation, and consumers discover
              one-of-a-kind attire for life’s most cherished celebrations.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
              <Users className="w-4 h-4" /> Join The Family
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-navy">
              Sell on Navya Collection
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you a boutique merchant, ethnic wear creator, or garment manufacturer? Expand your
              brand Pan-India with automated payouts, zero upfront setup cost, and dedicated
              shipping support.
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
      </div>
    </div>
  );
}
