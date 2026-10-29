'use client';

import { ShoppingBag, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { JIIVAA_ASSETS } from '@/config/jiivaa-mascot.config';

export function MarketplaceHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFFDFB] via-[#FFF9F2] to-[#FFF3E6]/70 rounded-3xl border border-orange-100/90 shadow-xs py-4 sm:py-5 md:py-6 px-4 sm:px-6 md:px-8 my-3 sm:my-4">
      {/* Warm Ambient Brand Glows */}
      <div className="absolute -top-12 -right-12 w-64 sm:w-80 h-64 sm:h-80 bg-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-12 items-center gap-3 sm:gap-6">
        {/* Left Column: Eyebrow + Headline + Subtitle + Action Buttons */}
        <div className="col-span-7 sm:col-span-7 md:col-span-7 lg:col-span-8 space-y-2 sm:space-y-3">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/90 border border-orange-200/70 text-slate-700 text-[10px] sm:text-xs font-semibold shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span className="truncate">Local Stores • Real Fashion • Nationwide</span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-1 sm:space-y-1.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[36px] xl:text-[40px] font-black tracking-tight text-navy-900 leading-[1.15] font-sans">
              Har Gali Ka Style, Ab India Ke{' '}
              <span className="text-orange block sm:inline">Har Shehar Tak.</span>
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm lg:text-[15px] text-slate-600 font-medium leading-relaxed max-w-xl">
              Discover fashion from verified local boutiques and clothing stores&nbsp;— trendy,
              affordable and uniquely Indian.
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-orange/25 transition-all duration-200 active:scale-95 cursor-pointer text-center"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Shop Fashion →</span>
            </Link>

            <Link
              href="/become-seller"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 bg-white text-navy-900 border-2 border-navy-900 hover:bg-navy-900 hover:text-white font-bold text-xs sm:text-sm rounded-full shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer text-center"
            >
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange shrink-0" />
              <span>Become a Seller</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Jiivaa Brand Mascot (Official Company Face) */}
        <div className="col-span-5 sm:col-span-5 md:col-span-5 lg:col-span-4 flex items-center justify-center sm:justify-end relative">
          <div className="relative w-full max-w-[145px] sm:max-w-[180px] md:max-w-[210px] lg:max-w-[230px] flex items-center justify-center sm:justify-end">
            {/* Subtle Character Backlight */}
            <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-xl pointer-events-none scale-90" />

            <Image
              src={JIIVAA_ASSETS.heroMascotTransparent.path}
              alt="Jiivaa - The Face of JiivaaKart"
              width={444}
              height={820}
              priority
              className="relative z-10 w-auto h-auto max-h-[175px] sm:max-h-[205px] md:max-h-[230px] lg:max-h-[250px] object-contain object-center drop-shadow-md select-none transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
