'use client';

import { Sparkles, Truck, RotateCcw, CreditCard, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AnnouncementBar() {
  const [activeOffer, setActiveOffer] = useState<string | null>(null);

  useEffect(() => {
    async function loadActiveOffer() {
      try {
        const res = await fetch('/api/v1/offers/active');
        if (!res.ok) return;
        const json = await res.json();
        const offers = json?.data?.offers;
        if (Array.isArray(offers) && offers.length > 0 && offers[0]?.title) {
          setActiveOffer(offers[0].title);
        }
      } catch {
        // Fall back to clean default
      }
    }
    loadActiveOffer();
  }, []);

  return (
    <div className="bg-[#0A2342] text-white text-[11px] sm:text-xs py-2 px-3 sm:px-6 border-b border-white/10 select-none z-30 shadow-xs">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Left Ticker / Value Props */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1.5 shrink-0 text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
            <span className="font-semibold">
              {activeOffer ? `Special Deal: ${activeOffer}` : 'Premium Fashion from Verified Local Boutiques'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-white/80">
            <Truck className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Pan-India Shipping</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 shrink-0 text-white/80">
            <RotateCcw className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Easy 7-Day Returns</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-white/80">
            <CreditCard className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>COD & Online Payments</span>
          </div>
        </div>

        {/* Right Tagline */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 text-[11px] text-white/85 font-medium">
          <span>India&apos;s Local Fashion Marketplace</span>
          <Heart className="w-3 h-3 text-red-400 fill-red-400" />
        </div>
      </div>
    </div>
  );
}
