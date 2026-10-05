'use client';

import { ArrowRight, Sparkles, Tag, Wallet } from 'lucide-react';
import Link from 'next/link';

const BUDGET_CARDS = [
  {
    title: 'Under ₹499',
    subtitle: 'Daily Basics & Essentials',
    description: 'T-shirts, socks, accessories & casual wear',
    href: '/shop?maxPrice=499',
    badge: 'POCKET FRIENDLY',
    accent: 'from-amber-500/15 via-orange-500/10 to-transparent border-amber-300',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    title: 'Under ₹999',
    subtitle: 'Everyday Trendy Fashion',
    description: 'Casual shirts, jeans, kurtas & dresses',
    href: '/shop?maxPrice=999',
    badge: 'MOST POPULAR',
    accent: 'from-orange-500/15 via-amber-500/10 to-transparent border-orange-300',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    title: 'Under ₹1,499',
    subtitle: 'Festive & Party Wear',
    description: 'Kurta sets, jackets, blazers & footwear',
    href: '/shop?maxPrice=1499',
    badge: 'FESTIVE PICKS',
    accent: 'from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    title: 'Premium Picks',
    subtitle: 'Designer & Handcrafted',
    description: 'Exclusive boutique couture & pure silks',
    href: '/shop?minPrice=1999',
    badge: 'BOUTIQUE LUXURY',
    accent: 'from-indigo-500/15 via-navy-900/10 to-transparent border-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
];

export function ShopByBudgetSection() {
  return (
    <section className="space-y-4 sm:space-y-5 my-8 sm:my-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-orange">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-navy-900 tracking-tight">
              Find Your Style, Fit Your Budget
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Curated fashion tailored for every budget
            </p>
          </div>
        </div>

        <Link
          href="/shop"
          className="text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>Explore All Price Tiers</span>
          <span>→</span>
        </Link>
      </div>

      {/* 4 Budget Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BUDGET_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative rounded-3xl border p-5 sm:p-6 bg-gradient-to-br ${card.accent} hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 active:scale-98`}
          >
            <div className="space-y-2.5">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${card.badgeBg} shadow-2xs`}
              >
                {card.badge}
              </span>

              <h3 className="text-2xl font-black text-navy-900 font-mono tracking-tight group-hover:text-orange transition-colors">
                {card.title}
              </h3>

              <div>
                <h4 className="text-xs font-bold text-slate-800">{card.subtitle}</h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-extrabold text-navy-900 group-hover:text-orange transition-colors border-t border-slate-200/60">
              <span>Browse Tier</span>
              <div className="w-7 h-7 rounded-full bg-white border border-slate-200 group-hover:bg-orange group-hover:text-white group-hover:border-orange flex items-center justify-center transition-all shadow-2xs">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
