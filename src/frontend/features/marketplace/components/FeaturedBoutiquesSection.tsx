'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ShopWithProducts {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  verificationBadge?: string | null;
  city?: string | null;
  state?: string | null;
  _count?: {
    products?: number;
  };
  products?: Array<{
    id: string;
    name: string;
    images?: Array<{ imageUrl?: string | null }>;
  }>;
}

interface FeaturedBoutiquesSectionProps {
  shops: ShopWithProducts[];
}

export function FeaturedBoutiquesSection({ shops }: FeaturedBoutiquesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (!shops || shops.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-5 my-8 sm:my-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-orange">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-navy-900 tracking-tight">
              Featured Local Boutiques
            </h2>
            <p className="text-xs text-slate-500 font-medium">Verified stores from across India</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors flex items-center gap-1 shrink-0"
          >
            <span>View All Shops</span>
            <span>→</span>
          </Link>

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => handleScroll('left')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Boutiques Scroll + Editorial Side Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left / Center Boutiques Carousel */}
        <div
          ref={scrollRef}
          className="lg:col-span-8 xl:col-span-9 flex items-stretch gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {shops.map((shop, index) => {
            const productCount = shop._count?.products || (shop.products?.length ?? 0);
            const bannerUrl = shop.banner || '/images/default-shop-banner.png';
            const cityDisplay = shop.city || 'India';
            const hasReviews = Boolean(shop.rating && (shop.reviewCount ?? 0) > 0);
            const ratingDisplay = shop.rating ? Number(shop.rating).toFixed(1) : null;
            const reviewsCount = shop.reviewCount || 0;

            return (
              <div
                key={shop.id}
                className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:border-orange/60 hover:shadow-lg transition-all duration-300 shadow-xs flex flex-col justify-between w-[270px] sm:w-[290px] shrink-0 snap-start relative group"
              >
                {/* Store Cover Image */}
                <div className="h-28 sm:h-32 bg-slate-900 relative overflow-hidden select-none">
                  <Image
                    src={bannerUrl}
                    alt={shop.name}
                    fill
                    priority={index < 2}
                    sizes="290px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Profile & Badges */}
                <div className="p-4 sm:p-5 -mt-8 relative z-10 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-end justify-between gap-2 mb-2.5">
                      <div className="w-13 h-13 rounded-2xl bg-white border-2 border-amber-500/40 overflow-hidden shrink-0 relative flex items-center justify-center shadow-md select-none">
                        {shop.logo ? (
                          <Image
                            src={shop.logo}
                            alt={shop.name}
                            fill
                            sizes="52px"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-orange" />
                        )}
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{shop.verificationBadge || 'Verified'}</span>
                      </span>
                    </div>

                    {/* Shop Name & City */}
                    <div>
                      <h3 className="font-extrabold text-navy-900 text-sm sm:text-base group-hover:text-orange transition-colors line-clamp-1 capitalize">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cityDisplay}</span>
                        </span>
                        {hasReviews ? (
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{ratingDisplay}</span>
                            <span className="text-slate-500 text-xs">({reviewsCount})</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-orange">
                            <Sparkles className="w-3.5 h-3.5 text-orange" />
                            <span>Verified Boutique</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Standardized 4-Slot Product Preview Gallery with Placeholders */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 mt-3 border-t border-slate-100">
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const prod = shop.products?.[slotIdx];
                        const thumb = prod?.images?.[0]?.imageUrl;
                        return (
                          <div
                            key={slotIdx}
                            className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative select-none flex items-center justify-center"
                          >
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={prod?.name || 'Product'}
                                fill
                                sizes="60px"
                                className="object-cover"
                              />
                            ) : (
                              <Store className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explore Button */}
                  <Link
                    href={`/shop/${shop.slug}`}
                    className="w-full text-center py-2.5 px-3 bg-slate-50 hover:bg-orange text-navy-900 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-200 hover:border-orange transition-all duration-200 block shadow-2xs mt-3"
                  >
                    Explore {productCount > 0 ? `${productCount} Styles` : 'Collection'} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Editorial Promo Card (Real Stores, Real People, Real Fashion) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="relative h-full min-h-[320px] lg:min-h-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 p-6 flex flex-col justify-between">
            <Image
              src="/images/editorial/boutique_merchant_promo.jpg"
              alt="Real Stores Real People Real Fashion"
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-transparent" />

            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-navy-900 text-xs font-bold shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-orange" />
                <span>Support Local • Choose Unique</span>
              </span>
            </div>

            <div className="relative z-10 space-y-3 text-white">
              <h3 className="text-xl sm:text-2xl font-black leading-snug tracking-tight font-sans text-white">
                Real Stores
                <br />
                Real People
                <br />
                <span className="text-orange">Real Fashion</span>
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed">
                Connect directly with passionate clothing store owners across Indian towns and
                cities.
              </p>
              <Link
                href="/shops"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md transition-colors mt-2 w-fit"
              >
                <span>Browse All Partner Boutiques</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
