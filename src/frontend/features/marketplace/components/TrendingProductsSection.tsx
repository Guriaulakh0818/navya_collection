'use client';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from '@/frontend/features/products/components/AddToCartButton';
import { WishlistButton } from '@/frontend/features/products/components/WishlistButton';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number | string | any;
  compareAtPrice?: number | string | any;
  rating?: number | null;
  reviewCount?: number | null;
  images?: Array<{ imageUrl?: string | null; url?: string | null }>;
  shop?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    verificationBadge?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface TrendingProductsSectionProps {
  products: ProductItem[];
}

export function TrendingProductsSection({ products }: TrendingProductsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-5 my-8 sm:my-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F28C28]">
            <Zap className="w-5 h-5 fill-[#F28C28]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0A2342] tracking-tight">
              Trending Marketplace Items
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Top-rated styles from our partner boutiques
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop?sort=trending"
            className="text-xs sm:text-sm font-extrabold text-[#F28C28] hover:text-[#d97718] transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Explore All</span>
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

      {/* Main Content Layout: Product Cards + Editorial Latest Arrivals Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left / Center Products Carousel */}
        <div
          ref={scrollRef}
          className="lg:col-span-8 xl:col-span-9 flex items-stretch gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory"
        >
          {products.map((p, index) => {
            const imageSrc =
              p.images?.[0]?.imageUrl ||
              p.images?.[0]?.url ||
              '/images/categories/men-shirts.jpg';
            const priceNum = Number(p.price || 0);
            const comparePriceNum = p.compareAtPrice ? Number(p.compareAtPrice) : null;
            const discountPercent =
              comparePriceNum && comparePriceNum > priceNum
                ? Math.round(((comparePriceNum - priceNum) / comparePriceNum) * 100)
                : null;
            const ratingNum = p.rating ? Number(p.rating).toFixed(1) : '4.6';
            const reviewsCount = p.reviewCount || 24 + index * 8;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-[#F28C28]/60 hover:shadow-lg transition-all duration-300 shadow-xs flex flex-col justify-between w-[200px] xs:w-[220px] sm:w-[240px] shrink-0 snap-start group"
              >
                {/* Product Image Container with Badges */}
                <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden select-none">
                  <Link href={`/product/${p.slug}`} className="block w-full h-full">
                    <Image
                      src={imageSrc}
                      alt={p.name}
                      fill
                      unoptimized
                      priority={index < 2}
                      sizes="240px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Badges (Top Left) */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                    {discountPercent && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FF4500] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {index === 0 && !discountPercent && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F28C28] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        BESTSELLER
                      </span>
                    )}
                    {index === 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        TRENDING
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button (Top Right) */}
                  <div className="absolute top-2 right-2 z-20">
                    <WishlistButton
                      product={p as any}
                      className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-xs flex items-center justify-center hover:bg-white text-slate-700 hover:text-rose-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Product Info & CTA */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <Link href={`/product/${p.slug}`}>
                      <h3 className="font-extrabold text-[#0A2342] text-xs sm:text-sm group-hover:text-[#F28C28] transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                    </Link>

                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {p.shop?.name || 'Local Boutique'}
                    </p>

                    {/* Price & Rating Row */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm sm:text-base font-black text-[#0A2342] font-mono">
                        ₹{priceNum.toLocaleString('en-IN')}
                      </span>
                      {comparePriceNum && comparePriceNum > priceNum && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          ₹{comparePriceNum.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{ratingNum}</span>
                      <span className="text-slate-400 font-normal">({reviewsCount})</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-1">
                    <AddToCartButton
                      product={p as any}
                      className="w-full text-xs font-bold py-2 shadow-2xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Editorial Promo Card (Latest Arrivals) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="relative h-full min-h-[320px] lg:min-h-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900 p-6 flex flex-col justify-between group">
            <Image
              src="/images/editorial/latest_arrivals_model.jpg"
              alt="Latest Arrivals from Local Boutiques"
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover object-center opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#0A2342] text-[10px] font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3 h-3 text-[#F28C28]" />
                <span>Season 2026 Drop</span>
              </span>
            </div>

            <div className="relative z-10 space-y-3 text-white">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight font-sans text-white">
                  Latest
                  <br />
                  Arrivals
                </h3>
                <p className="text-xs text-white/80 font-medium leading-relaxed mt-1">
                  Fresh styles from local boutiques added daily.
                </p>
              </div>

              <Link
                href="/shop?filter=new"
                className="w-11 h-11 rounded-full bg-[#F28C28] hover:bg-[#e07d1e] text-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
                aria-label="Explore latest arrivals"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
