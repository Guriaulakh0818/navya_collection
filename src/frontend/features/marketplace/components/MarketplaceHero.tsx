'use client';

import { ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';

export function MarketplaceHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange/5 rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 md:p-8 my-3 sm:my-4">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-900/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5 sm:space-y-4">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <span>Local Stores • Real Fashion • Nationwide</span>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[42px] font-black tracking-tight text-navy-900 leading-tight font-sans">
            Har Gali Ka Style, Ab India Ke <span className="text-orange">Har Shehar Tak.</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-2xl [text-wrap:balance]">
            Discover fashion from verified local boutiques and clothing stores&nbsp;— trendy,
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
      </div>
    </section>
  );
}
