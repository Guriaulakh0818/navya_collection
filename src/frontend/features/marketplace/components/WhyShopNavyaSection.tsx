'use client';

import { CreditCard, Gem, RotateCcw, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';

const TRUST_FEATURES = [
  {
    title: 'Verified Local Stores',
    description: 'Authentic boutiques from across India',
    icon: Store,
    accent: 'text-orange bg-amber-50 border-amber-200',
  },
  {
    title: 'Unique & Trendy Styles',
    description: "Discover styles you won't find everywhere",
    icon: Gem,
    accent: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    title: 'Pan-India Delivery',
    description: 'Your local store, delivered to your doorstep',
    icon: Truck,
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
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
    accent: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

export function WhyShopNavyaSection() {
  return (
    <section className="space-y-4 sm:space-y-5 my-8 sm:my-10">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-50 text-orange">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-navy-900 tracking-tight">
            Why Shop on Navya?
          </h2>
          <p className="text-xs text-slate-500 font-medium">
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
