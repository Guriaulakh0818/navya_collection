'use client';

import { Award, ChevronRight, Gift, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const PROMOS = [
  {
    id: 'referral',
    icon: Gift,
    badge: 'Refer & Earn',
    text: 'Har dost par kamao ₹50! Dost ko milega ₹50 welcome discount on first order.',
    cta: 'Start Earning',
    link: '/account/referrals',
  },
  {
    id: 'founding',
    icon: Award,
    badge: 'Founding 50',
    text: 'First 50 fashion boutiques get flat 5.0% commission tier. Limited slots open!',
    cta: 'Become a Seller',
    link: '/become-seller',
  },
  {
    id: 'budget',
    icon: Sparkles,
    badge: 'Under ₹499',
    text: 'Authentic Indian boutique fashion starting at just ₹499 with Pan-India delivery.',
    cta: 'Shop Now',
    link: '/category/under-499',
  },
];

export function OnScreenNotificationBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('jiivaa_top_banner_dismissed');
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMOS.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const currentPromo = PROMOS[currentIndex];
  const IconComponent = currentPromo.icon;

  return (
    <>
      <style jsx>{`
        @keyframes bannerMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-banner-marquee {
          animation: bannerMarquee 15s linear infinite;
        }
        .animate-banner-marquee:hover,
        .animate-banner-marquee:active {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-gradient-to-r from-navy via-[#1F4588] to-navy text-white text-xs py-1.5 sm:py-2 px-2.5 sm:px-6 relative shadow-xs z-30 transition-all select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Fixed Left: Program Badge */}
          <Link
            href={currentPromo.link}
            className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 shrink-0 transition-all active:scale-95 z-10"
          >
            <IconComponent className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">{currentPromo.badge}</span>
          </Link>

          {/* Center: Continuously Scrolling Ticker on Mobile & Smooth Text on Desktop */}
          <Link
            href={currentPromo.link}
            className="relative flex-1 overflow-hidden h-5 flex items-center text-[11px] sm:text-xs text-slate-100 font-medium cursor-pointer"
            title={currentPromo.text}
          >
            {/* Mobile: Continuous Smooth Ticker (never cut off with ...) */}
            <div className="sm:hidden flex whitespace-nowrap will-change-transform animate-banner-marquee">
              <span className="inline-block pr-6">{currentPromo.text}</span>
              <span className="inline-block pr-6 font-bold text-amber-300">•</span>
              <span className="inline-block pr-6">{currentPromo.text}</span>
              <span className="inline-block pr-6 font-bold text-amber-300">•</span>
            </div>

            {/* Desktop: Standard clean centered/left text */}
            <span className="hidden sm:inline-block truncate">{currentPromo.text}</span>
          </Link>

          {/* Fixed Right: Fixed CTA Button (Always visible on mobile & desktop!) */}
          <div className="flex items-center gap-1.5 shrink-0 z-10">
            <Link
              href={currentPromo.link}
              className="inline-flex items-center gap-0.5 sm:gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] sm:text-xs shadow-xs transition-all active:scale-95"
            >
              <span className="whitespace-nowrap">{currentPromo.cta}</span>
              <ChevronRight className="w-3 h-3 text-slate-950 stroke-[3]" />
            </Link>

            {/* Fixed Dismiss Button */}
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                sessionStorage.setItem('jiivaa_top_banner_dismissed', 'true');
              }}
              className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Dismiss banner"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
