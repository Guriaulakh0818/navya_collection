'use client';

import { Check, Gift, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function RefereePromoRibbon() {
  const [code, setCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState('Friend');
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('jiivaa_referee_ribbon_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const urlRef = searchParams.get('ref');
    let cookieRef = '';
    const match = document.cookie.match(/jiivaa_referral_code=([^;]+)/);
    if (match && match[1]) {
      cookieRef = decodeURIComponent(match[1]);
    }

    const activeCode = (urlRef || cookieRef || '').trim().toUpperCase();

    if (activeCode && activeCode.startsWith('JIIVAA-')) {
      setCode(activeCode);

      fetch(`/api/v1/referral/resolve?code=${encodeURIComponent(activeCode)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setReferrerName(res.data.referrerName || 'Friend');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jiivaa_referee_ribbon_dismissed', 'true');
    }
  };

  if (!mounted || isDismissed || !code) return null;

  return (
    <aside
      aria-label="Welcome referral discount offer"
      className="bg-gradient-to-r from-navy via-[#112d54] to-navy text-white text-[11px] sm:text-xs py-2 px-3 sm:px-4 border-b border-navy/40 relative z-40 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-5 h-5 rounded-full bg-orange/20 text-orange flex items-center justify-center shrink-0">
            <Gift className="w-3 h-3 text-orange" />
          </span>
          <span className="truncate">
            <strong className="text-orange font-black">₹150 OFF Welcome Gift:</strong> Invited by{' '}
            <span className="font-bold underline decoration-orange/60">{referrerName}</span> with
            code{' '}
            <strong className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-black">
              {code}
            </strong>{' '}
            (Auto-applies on orders ₹999+)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cart"
            className="hidden sm:inline-flex items-center gap-1 font-black text-orange hover:text-orange-300 hover:underline text-[11px]"
          >
            <span>View in Bag</span>
            <span>&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
