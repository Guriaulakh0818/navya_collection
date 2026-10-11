'use client';

import {
  CreditCard,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

export function MarketplaceHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30 rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 md:p-8 my-3 sm:my-5">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-900/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 sm:space-y-5">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <span>Local Stores • Real Fashion • Nationwide</span>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[42px] font-black tracking-tight text-navy-900 leading-tight font-sans">
            Har Gali Ka Style, Ab India Ke{' '}
            <span className="text-orange">Har Shehar Tak.</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-3xl">
            Discover fashion from verified local boutiques and clothing stores — trendy,
            affordable and uniquely Indian.
          </p>
        </div>

        {/* Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Fashion →</span>
          </Link>

          <Link
            href="/become-seller"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-white text-navy-900 border-2 border-navy-900 hover:bg-navy-900 hover:text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4 text-orange" />
            <span>Become a Seller</span>
          </Link>
        </div>

        {/* Trust Indicators Grid */}
        <div className="pt-4 sm:pt-5 border-t border-slate-200/90 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-left">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900 leading-tight">Verified Local Stores</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Shop with confidence</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900 leading-tight">Pan-India Shipping</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across 29,000+ pincodes</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-amber-50 text-orange shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900 leading-tight">
                Easy Returns & Replacements
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">3-day return & 7-day exchange</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900 leading-tight">
                COD & Online Payments
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Multiple secure options</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
