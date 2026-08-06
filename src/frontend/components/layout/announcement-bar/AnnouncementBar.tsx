'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const announcements = [
  { text: '🚚 FREE Shipping across India on orders above ₹999!', badge: 'LIMITED' },
  { text: '🎉 Festival Special: Extra 15% OFF with code NAVYA15', badge: 'OFFER' },
  { text: '✨ Premium Gents & Kids Wear — Crafted for Perfection', badge: 'BRAND' },
  { text: '🔄 Easy 7-Day Hassle-Free Exchange & Return Policy', badge: 'TRUST' },
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative bg-[#183A73] text-white text-[11px] sm:text-xs font-medium py-1.5 px-2 sm:px-6 overflow-hidden border-b border-white/10 select-none z-30">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-1 sm:gap-3">
        {/* Left Arrow */}
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)
          }
          className="text-white/80 hover:text-white transition-colors shrink-0 p-1 rounded-full hover:bg-white/10"
          aria-label="Previous announcement"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        {/* Center Text Container (Fully Responsive on 320px, 375px, 414px, and Desktop) */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center text-center overflow-hidden">
          <span className="bg-[#F15A25] px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wide uppercase shrink-0 shadow-xs">
            {announcements[currentIndex].badge}
          </span>
          <span className="truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none text-[11px] sm:text-xs font-semibold">
            {announcements[currentIndex].text}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ml-0.5"
            aria-label="Close announcement bar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
