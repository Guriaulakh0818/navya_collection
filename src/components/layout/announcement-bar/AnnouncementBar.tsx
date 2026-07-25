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
    <div className="relative bg-navy text-white text-xs font-medium py-2 px-8 overflow-hidden border-b border-navy-light/20">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)
          }
          className="text-white/70 hover:text-white transition-colors"
          aria-label="Previous announcement"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 transition-all duration-300">
          <span className="bg-orange px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
            {announcements[currentIndex].badge}
          </span>
          <span className="truncate">{announcements[currentIndex].text}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/50 hover:text-white transition-colors ml-2"
            aria-label="Close announcement bar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
