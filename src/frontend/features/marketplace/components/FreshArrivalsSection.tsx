'use client';

import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Star } from 'lucide-react';
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

interface FreshArrivalsSectionProps {
  products: ProductItem[];
}

export function FreshArrivalsSection({ products }: FreshArrivalsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 280;
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
          <div className="p-2 rounded-xl bg-amber-50 text-orange">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-navy-900 tracking-tight">
              Fresh Arrivals
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Just added by our partner boutiques
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop?filter=new"
            className="text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
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

      {/* Fresh Arrivals Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory"
      >
        {products.map((p, index) => {
          const imageSrc =
            p.images?.[0]?.imageUrl || p.images?.[0]?.url || '/images/categories/men-shirts.jpg';
          const priceNum = Number(p.price || 0);
          const comparePriceNum = p.compareAtPrice ? Number(p.compareAtPrice) : null;

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-orange/60 hover:shadow-lg transition-all duration-300 shadow-xs flex flex-col justify-between w-[180px] xs:w-[200px] sm:w-[220px] md:w-[240px] shrink-0 snap-start group"
            >
              {/* Product Image Container with NEW Badge */}
              <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden select-none">
                <Link href={`/product/${p.slug}`} className="block w-full h-full">
                  <Image
                    src={imageSrc}
                    alt={p.name}
                    fill
                    unoptimized
                    priority={index < 3}
                    sizes="220px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                    NEW
                  </span>
                </div>

                <div className="absolute top-2 right-2 z-20">
                  <WishlistButton
                    product={p as any}
                    className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-xs flex items-center justify-center hover:bg-white text-slate-700 hover:text-rose-600 transition-colors"
                  />
                </div>
              </div>

              {/* Info & Add to Cart */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <Link href={`/product/${p.slug}`}>
                    <h3 className="font-extrabold text-navy-900 text-xs sm:text-sm group-hover:text-orange transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {p.shop?.name || 'Local Boutique'}
                  </p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-sm sm:text-base font-black text-navy-900 font-mono">
                      ₹{priceNum.toLocaleString('en-IN')}
                    </span>
                    {comparePriceNum && comparePriceNum > priceNum && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        ₹{comparePriceNum.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

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
    </section>
  );
}
