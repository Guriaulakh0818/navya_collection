'use client';

import {
  CreditCard,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HERO_SLIDES = [
  {
    id: 1,
    image: '/images/editorial/hero_fashion_models.jpg',
    alt: 'Navya Collection - Har Gali Ka Style, Ab India Ke Har Shehar Tak',
    topBadge: 'Support Local • Wear Global',
    bottomSub: 'Fashion That Brings',
    bottomMain: 'India Together',
  },
  {
    id: 2,
    image: '/images/editorial/hero_fashion_slide2.jpg',
    alt: 'Discover Trending Boutique Fashion on Navya Collection',
    topBadge: 'Handcrafted • Trendsetting',
    bottomSub: 'Verified Boutiques',
    bottomMain: 'Across India',
  },
  {
    id: 3,
    image: '/images/editorial/hero_fashion_slide3.jpg',
    alt: 'Authentic Indian Stores & Designer Fashion',
    topBadge: 'Designer Styles • Best Value',
    bottomSub: 'Authentic Fashion',
    bottomMain: 'Direct From Stores',
  },
];

export function MarketplaceHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30 rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8 lg:p-10 my-4 sm:my-6">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0A2342]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column (Editorial Headline, CTA, Trust Badges) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#F28C28] animate-pulse" />
            <span>Local Stores • Real Fashion • Nationwide</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-[#0A2342] leading-[1.12] font-sans">
              Har Gali Ka Style,
              <br />
              Ab India Ke <span className="text-[#F28C28]">Har Shehar Tak.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl pt-2">
              Discover fashion from verified local boutiques and clothing stores — trendy,
              affordable and uniquely Indian.
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-[#F28C28] hover:bg-[#e07d1e] text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-[#F28C28]/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Fashion →</span>
            </Link>

            <Link
              href="/become-seller"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-white hover:bg-slate-50 text-[#0A2342] border border-slate-300 hover:border-slate-400 font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#F28C28]" />
              <span>Become a Seller</span>
            </Link>
          </div>

          {/* Trust Indicators Grid */}
          <div className="pt-6 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0A2342] leading-tight">Verified Local Stores</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Shop with confidence</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0A2342] leading-tight">Pan-India Shipping</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Across 29000+ pincodes</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-50 text-[#F28C28] shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0A2342] leading-tight">7-Day Easy Returns</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Hassle-free exchange</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0A2342] leading-tight">COD & Online Payments</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Multiple secure options</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Auto-rotating Hero Slides with Badges) */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white shadow-xl bg-slate-900">
            {/* Image Slides */}
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center transform hover:scale-102 transition-transform duration-700"
                />
              </div>
            ))}

            {/* Subtle Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-20" />

            {/* Dynamic Floating Editorial Badge 1 (Top Right) */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-lg text-[11px] sm:text-xs font-black text-[#0A2342] flex items-center gap-1.5 z-30 transition-all duration-300 animate-bounce-slow">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>{activeSlide.topBadge}</span>
            </div>

            {/* Dynamic Floating Editorial Badge 2 (Bottom Right) */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-[#0A2342]/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-white/20 shadow-xl max-w-[210px] text-right z-30 transition-all duration-300">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#F28C28]">
                {activeSlide.bottomSub}
              </p>
              <p className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                {activeSlide.bottomMain}
              </p>
            </div>

            {/* Interactive Carousel Indicator Dots */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full z-30 shadow-md">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    index === currentSlide
                      ? 'w-5 h-2 bg-[#F28C28]'
                      : 'w-2 h-2 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
