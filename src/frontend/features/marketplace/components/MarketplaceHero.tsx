'use client';

import {
  Building2,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

export function MarketplaceHero() {
  return (
    <div className="relative overflow-hidden bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-md my-6">
      {/* Background Subtle Warm Glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 max-w-5xl mx-auto text-center space-y-6">
        {/* Top Pill Badge - Motivational Mission */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase tracking-widest shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Empowering Every Local Clothing Store To Go Digital Across India
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-tight font-sans">
          Har Gali, Har Shehar Ki Local Dukan Ko{' '}
          <span className="text-amber-600 font-extrabold">Online Pehchan</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Bringing India&apos;s finest local clothing stores, weavers, and designer creators
          directly to digital shoppers nationwide. Build your store online in minutes or explore
          authentic ethnic fashion from verified local stores.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            Explore Marketplace Catalog
          </Link>

          <Link
            href="/become-seller"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-extrabold text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Store className="w-5 h-5 text-amber-600" />
            Become Seller ✨
          </Link>
        </div>

        {/* Key Guarantee Pills */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Authentic Quality</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Pan-India Express Shipping</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
            <Store className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Direct From Local Boutiques</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Secure COD & Online Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
