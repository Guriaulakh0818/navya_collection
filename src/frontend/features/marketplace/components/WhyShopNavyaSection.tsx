'use client';

import { CreditCard, Gem, RotateCcw, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';

const TRUST_FEATURES = [
  {
    title: 'Verified Local Stores',
    description: 'Authentic boutiques from across India',
    icon: Store,
    accent: 'text-orange bg-orange/10 border-orange/20',
  },
  {
    title: 'Unique & Trendy Styles',
    description: "Discover styles you won't find everywhere",
    icon: Gem,
    accent: 'text-navy bg-navy/10 border-navy/20',
  },
  {
    title: 'Pan-India Delivery',
    description: 'Your local store, delivered to your doorstep',
    icon: Truck,
    accent: 'text-navy bg-navy/10 border-navy/20',
  },
  {
    title: 'Hassle-Free Returns',
    description: '3-day returns & 7-day size replacements',
    icon: RotateCcw,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    title: 'Secure Payments',
    description: 'COD, UPI, Cards & more',
    icon: ShieldCheck,
    accent: 'text-orange bg-orange/10 border-orange/20',
  },
];

export function WhyShopNavyaSection() {
  return (
    <section className="space-y-4 sm:space-y-5 my-8 sm:my-10">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="p-1.5 sm:p-2 rounded-xl bg-orange/10 text-orange shrink-0">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs min-[380px]:text-[13px] sm:text-base md:text-lg font-black text-navy-900 tracking-tight whitespace-nowrap">
            Why Shop on JiivaaKart?
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
            Building India&apos;s most trusted fashion marketplace for local clothing stores
          </p>
        </div>
      </div>

      {/* 5 Feature Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {TRUST_FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-3"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-extrabold text-navy-900 text-xs sm:text-sm leading-tight">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
