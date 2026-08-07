'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

const announcements = [
  { text: '🚚 FREE Shipping across India on orders above ₹999!', badge: 'LIMITED' },
  { text: '🎉 Festival Special: Extra 15% OFF with code NAVYA15', badge: 'OFFER' },
  { text: '✨ Premium Gents & Kids Wear — Crafted for Perfection', badge: 'BRAND' },
  { text: '🔄 Easy 7-Day Hassle-Free Exchange & Return Policy', badge: 'TRUST' },
];

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative bg-[#183A73] text-white text-xs font-medium py-2 overflow-hidden border-b border-white/10 select-none z-30 shadow-xs">
      <div className="flex items-center w-full overflow-hidden">
        {/* Continuous Marquee Ticker Track (Repeated twice for seamless infinite loop) */}
        <div className="animate-marquee flex items-center whitespace-nowrap gap-8 sm:gap-12 pl-4">
          {[...announcements, ...announcements].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <span className="bg-[#F15A25] px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase shrink-0 shadow-xs">
                {item.badge}
              </span>
              <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white/95">
                {item.text}
              </span>
              <span className="text-white/30 text-xs ml-2">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Close Button on Right */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1 rounded-full bg-[#183A73]/90 hover:bg-white/20 z-10 cursor-pointer shadow-xs"
        aria-label="Close announcement bar"
        title="Close offer banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
