'use client';

import { ArrowRight, Sparkles, Store, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function SellerStorySection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-100/40 border border-amber-200/90 p-6 sm:p-8 lg:p-10 my-8 sm:my-12 shadow-xs">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Headline & Description */}
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-orange" />
            <span>Merchant Partner Onboarding</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-navy-900 leading-[1.15] font-sans">
            Your Favourite Local Store
            <br />
            Deserves an Online Address.
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-lg">
            Join Navya Collection and take your store beyond your neighbourhood. Reach customers
            across India and grow your business online with 0% setup friction.
          </p>

          <div className="pt-2">
            <Link
              href="/become-seller"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-orange hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-orange/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Become a Seller</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Flow Diagram & Badge */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
          {/* Flow Stepper Container */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-amber-200/80 p-4 sm:p-5 shadow-sm flex items-center justify-center gap-3 sm:gap-4">
            {/* Step 1: Your Store */}
            <div className="flex flex-col items-center text-center space-y-1.5 min-w-[72px]">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-orange shadow-2xs">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-extrabold text-navy-900">Your Store</span>
            </div>

            <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />

            {/* Step 2: Navya Collection */}
            <div className="flex flex-col items-center text-center space-y-1.5 min-w-[72px]">
              <div className="w-12 h-12 rounded-full bg-navy-900 border-2 border-white shadow-md flex items-center justify-center relative overflow-hidden">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white">
                  <Image src="/logo.png" alt="Navya Logo" fill className="object-cover" />
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-navy-900">Navya Platform</span>
            </div>

            <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />

            {/* Step 3: Pan India Customers */}
            <div className="flex flex-col items-center text-center space-y-1.5 min-w-[72px]">
              <div className="w-12 h-12 rounded-2xl bg-orange-100/80 border border-orange-300 flex items-center justify-center text-orange shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-extrabold text-navy-900">Pan-India Reach</span>
            </div>
          </div>

          {/* Script Callout Tag */}
          <div className="bg-white/80 border border-amber-300/80 rounded-2xl px-4 py-3 shadow-2xs text-center sm:text-left">
            <p className="font-serif italic text-sm font-bold text-navy-900 leading-tight">
              Local Businesses
            </p>
            <p className="font-serif italic text-sm font-bold text-orange leading-tight">
              Stronger Together ✨
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
