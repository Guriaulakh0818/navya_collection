'use client';

import { ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';

const BUDGET_CARDS = [
  {
    title: 'Under ₹499',
    href: '/shop?maxPrice=499',
    badge: 'POCKET FRIENDLY',
    accent: 'from-orange/10 via-orange/5 to-white border-orange/30',
    badgeBg: 'bg-orange/10 text-orange border-orange/30',
  },
  {
    title: 'Under ₹999',
    href: '/shop?maxPrice=999',
    badge: 'MOST POPULAR',
    accent: 'from-navy/10 via-navy/5 to-white border-navy/20',
    badgeBg: 'bg-navy/10 text-navy border-navy/20',
  },
  {
    title: 'Under ₹1,499',
    href: '/shop?maxPrice=1499',
    badge: 'FESTIVE PICKS',
    accent: 'from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    title: 'Premium Picks',
    href: '/shop?minPrice=1999',
    badge: 'BOUTIQUE LUXURY',
    accent: 'from-navy-900/10 via-navy/5 to-white border-navy-900/30',
    badgeBg: 'bg-navy-900 text-white border-navy-900',
  },
];

export function ShopByBudgetSection() {
  return (
    <section className="space-y-3 sm:space-y-4 my-4 sm:my-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-orange/10 text-orange shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-navy-900 tracking-tight leading-snug">
              <span className="inline-block">Find Your Style,&nbsp;</span>
              <span className="inline-block">Fit Your Budget</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate">
              Curated fashion tailored for every budget
            </p>
          </div>
        </div>

        <Link
          href="/shop"
          className="text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Explore All Price Tiers</span>
          <span className="sm:hidden">Explore All</span>
          <span>→</span>
        </Link>
      </div>

      {/* 4 Compact Budget Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {BUDGET_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative rounded-2xl border p-3 sm:p-3.5 bg-gradient-to-br ${card.accent} hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-2 active:scale-98`}
          >
            <div className="space-y-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider border ${card.badgeBg} shadow-2xs`}
              >
                {card.badge}
              </span>

              <h3 className="text-base sm:text-lg lg:text-xl font-black text-navy-900 font-mono tracking-tight group-hover:text-orange transition-colors">
                {card.title}
              </h3>
            </div>

            <div className="pt-1.5 flex items-center justify-between text-[11px] font-extrabold text-navy-900 group-hover:text-orange transition-colors border-t border-slate-200/60">
              <span>Browse Tier</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-slate-200 group-hover:bg-orange group-hover:text-white group-hover:border-orange flex items-center justify-center transition-all shadow-2xs">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
