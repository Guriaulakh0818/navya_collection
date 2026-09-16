import { CheckCircle2, PackageCheck, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';
import Link from 'next/link';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Explore Local Boutiques',
    description:
      'Browse clothing stores, regional artisans, and independent fashion boutiques across India.',
    icon: Store,
    accent: 'text-[#F28C28] bg-amber-50 border-amber-200',
  },
  {
    step: '02',
    title: 'Choose Your Style',
    description:
      'Select authentic ethnic wear, western outfits, and accessories with clear pricing and size charts.',
    icon: ShoppingBag,
    accent: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    step: '03',
    title: 'Secure & Flexible Checkout',
    description:
      'Pay securely with UPI, Cards, Net Banking, or choose Cash on Delivery (COD) at your doorstep.',
    icon: ShieldCheck,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    step: '04',
    title: 'Direct Pan-India Delivery',
    description:
      'Partner boutiques pack your order, dispatched via verified logistics with end-to-end tracking.',
    icon: Truck,
    accent: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

export function HowNavyaWorksSection() {
  return (
    <section className="space-y-6 sm:space-y-8 my-8 sm:my-12 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider">
            <PackageCheck className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Marketplace Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A2342] tracking-tight font-sans">
            How Navya Collection Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Connecting fashion lovers directly with local clothing stores and boutique owners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-extrabold text-[#F28C28] hover:text-[#d97718] transition-colors"
          >
            Explore Catalog →
          </Link>
        </div>
      </div>

      {/* 4 Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {WORKFLOW_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-400 font-mono">
                  {item.step}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0A2342] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
