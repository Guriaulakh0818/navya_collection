'use client';

import { Award, Gift, ShoppingBag, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const SOCIAL_ACTIVITIES = [
  {
    icon: ShoppingBag,
    iconColor: 'text-orange',
    bgColor: 'bg-orange-50',
    title: 'New Boutique Collection',
    desc: 'Navya Collection (Hisar) just listed new festive styles!',
    link: '/shop/navya-collection',
    time: '2 mins ago',
  },
  {
    icon: Gift,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    title: 'Refer & Earn Reward',
    desc: 'A shopper from Fatehabad just earned ₹50 referral credits!',
    link: '/account/referrals',
    time: '5 mins ago',
  },
  {
    icon: Award,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    title: 'Founding Boutique Partner',
    desc: 'SK Boutique (Fatehabad) joined as Founding Seller #4!',
    link: '/shop/sk-boutique',
    time: '12 mins ago',
  },
  {
    icon: Star,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    title: 'Verified 5-Star Order',
    desc: 'Customer in Delhi received an express delivery order!',
    link: '/shop',
    time: '18 mins ago',
  },
];

export function FloatingSocialProofToast() {
  const [currentToastIndex, setCurrentToastIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedPermanently, setIsDismissedPermanently] = useState(false);

  useEffect(() => {
    // Initial delay before showing first toast (10s)
    const initialTimer = setTimeout(() => {
      if (!isDismissedPermanently) {
        setIsVisible(true);
      }
    }, 10000);

    // Periodic toast interval (shows for 6s, hides for 24s)
    const interval = setInterval(() => {
      if (isDismissedPermanently) return;

      setIsVisible(true);
      setCurrentToastIndex((prev) => (prev + 1) % SOCIAL_ACTIVITIES.length);

      // Auto-hide after 6 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissedPermanently]);

  if (!isVisible || isDismissedPermanently) return null;

  const current = SOCIAL_ACTIVITIES[currentToastIndex];
  const IconComponent = current.icon;

  return (
    <div className="fixed bottom-14 left-3 sm:bottom-16 sm:left-5 z-30 max-w-xs w-[calc(100%-2rem)] sm:w-80 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl ${current.bgColor} flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <IconComponent className={`w-4 h-4 ${current.iconColor}`} />
        </div>

        <div className="flex-1 pr-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {current.title}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 font-mono">
              {current.time}
            </span>
          </div>

          <Link
            href={current.link}
            className="block text-xs font-bold text-slate-800 hover:text-navy transition-colors mt-0.5 leading-snug truncate"
          >
            {current.desc}
          </Link>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setIsDismissedPermanently(true);
          }}
          className="text-slate-300 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
