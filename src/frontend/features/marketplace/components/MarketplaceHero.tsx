'use client';

import { ShoppingBag, Store } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { JIIVAA_ASSETS } from '@/config/jiivaa-mascot.config';

export function MarketplaceHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFFDFB] via-[#FFF9F2] to-[#FFF3E6]/70 rounded-2xl sm:rounded-3xl border border-orange-100/90 shadow-2xs py-3 sm:py-3.5 md:py-3 px-3.5 sm:px-5 md:px-7 my-1.5 sm:my-2">
      {/* Warm Ambient Brand Glows */}
      <div className="absolute -top-10 -right-10 w-48 sm:w-64 h-48 sm:h-64 bg-orange/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 left-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-12 items-center gap-2.5 sm:gap-4 md:gap-6">
        {/* Left Column: Eyebrow + Headline + Subtitle + Action Buttons */}
        <div className="col-span-7 sm:col-span-7 md:col-span-8 space-y-1.5 sm:space-y-2">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-orange-200/70 text-slate-700 text-[9px] sm:text-[11px] font-semibold shadow-2xs backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
            <span className="truncate">Local Stores • Real Fashion • Nationwide</span>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-[13px] xs:text-[15px] sm:text-lg md:text-xl lg:text-2xl xl:text-[26px] font-black tracking-tight text-navy-900 leading-[1.2] font-sans">
              Har Gali Ka Style, Ab India Ke{' '}
              <span className="text-orange block sm:inline">Har Shehar Tak.</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-600 font-medium leading-snug line-clamp-2 sm:line-clamp-none max-w-xl">
              Discover fashion from verified local boutiques and clothing stores&nbsp;— trendy,
              affordable and uniquely Indian.
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2.5 pt-0.5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 sm:px-4 md:px-5 py-2 sm:py-2 bg-orange hover:bg-orange-600 text-white font-bold text-xs rounded-full shadow-xs shadow-orange/25 transition-all duration-200 active:scale-95 cursor-pointer text-center"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Shop Fashion →</span>
            </Link>

            <Link
              href="/become-seller"
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 sm:px-4 md:px-5 py-2 sm:py-2 bg-white text-navy-900 border border-navy-900 hover:bg-navy-900 hover:text-white font-bold text-xs rounded-full shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer text-center"
            >
              <Store className="w-3.5 h-3.5 text-orange shrink-0" />
              <span>Become a Seller</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Jiivaa Brand Mascot (Official Company Face) */}
        <div className="col-span-5 sm:col-span-5 md:col-span-4 self-stretch flex items-end justify-end relative">
          <div className="relative w-full h-full min-h-[170px] sm:min-h-[185px] md:min-h-0 flex items-end justify-end">
            {/* Subtle Character Backlight */}
            <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-lg pointer-events-none scale-90" />

            <Image
              src={JIIVAA_ASSETS.heroMascotTransparent.path}
              alt="Jiivaa - The Face of JiivaaKart"
              width={444}
              height={820}
              priority
              className="relative z-10 w-auto h-full max-h-[185px] sm:max-h-[200px] md:max-h-[160px] lg:max-h-[175px] object-contain object-bottom drop-shadow-md select-none transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
