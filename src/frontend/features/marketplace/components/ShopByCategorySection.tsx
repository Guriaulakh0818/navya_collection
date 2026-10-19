'use client';

import { Flame, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  image: string;
  href: string;
  badge?: string;
  badgeBg?: string;
  isSpecial?: boolean;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: 'women',
    name: 'Women',
    image: '/images/categories/category-women.jpg',
    href: '/category/women',
    badge: 'POPULAR',
    badgeBg: 'bg-orange',
    isSpecial: true,
  },
  {
    id: 'men',
    name: 'Men',
    image: '/images/categories/category-men.jpg',
    href: '/category/men',
    badge: 'STYLE',
    badgeBg: 'bg-navy',
    isSpecial: true,
  },
  {
    id: 'kids',
    name: 'Kids',
    image: '/images/categories/category-kids.jpg',
    href: '/category/kids',
    badge: 'NEW',
    badgeBg: 'bg-emerald-600',
  },
  {
    id: 't-shirts',
    name: 'T-Shirts',
    image: '/images/categories/men-tshirts.jpg',
    href: '/category/men-t-shirts',
    badge: 'HOT',
    badgeBg: 'bg-orange',
  },
  {
    id: 'shirts',
    name: 'Shirts',
    image: '/images/categories/men-shirts.jpg',
    href: '/category/men-shirts',
  },
  {
    id: 'jeans',
    name: 'Jeans',
    image: '/images/categories/men-jeans.jpg',
    href: '/category/men-jeans',
    badge: 'BESTSELLER',
    badgeBg: 'bg-navy',
  },
  {
    id: 'trousers',
    name: 'Trousers',
    image: '/images/categories/men-trousers.jpg',
    href: '/category/men-trousers',
  },
  {
    id: 'cargo-pants',
    name: 'Cargo Pants',
    image: '/images/categories/men-cargos.jpg',
    href: '/category/men-cargo-pants',
    badge: 'TRENDING',
    badgeBg: 'bg-orange',
  },
  {
    id: 'kurta-sets',
    name: 'Kurta Sets',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600',
    href: '/category/women-kurta-sets',
  },
  {
    id: 'sarees',
    name: 'Sarees',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
    href: '/category/women-sarees',
  },
];

export function ShopByCategorySection() {
  return (
    <section className="space-y-4 sm:space-y-5 my-6 sm:my-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange/10 text-orange">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-navy-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Find exactly what you&apos;re looking for
            </p>
          </div>
        </div>

        <Link
          href="/category"
          className="text-xs sm:text-sm font-extrabold text-orange hover:text-orange-600 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>View All Categories</span>
          <span>→</span>
        </Link>
      </div>

      {/* Circular Category Grid / Horizontal Scroll */}
      <div
        className="flex items-center justify-start xl:justify-between gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-none no-scrollbar pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORY_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col items-center text-center w-[74px] sm:w-[88px] md:w-[98px] lg:w-[104px] shrink-0 transition-all duration-300 active:scale-95"
          >
            {/* Circular Avatar Container */}
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full p-1 border-2 transition-all duration-300 flex items-center justify-center ${
                item.isSpecial
                  ? 'border-orange/60 bg-orange/5 shadow-xs'
                  : 'border-slate-200/90 bg-white group-hover:border-orange group-hover:shadow-md'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 64px, 88px"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Special Badge (e.g. HOT, BESTSELLER, TRENDING) */}
              {item.badge && (
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 rounded-full text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs whitespace-nowrap ${
                    item.badgeBg || 'bg-orange'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={`mt-2 text-xs sm:text-sm font-extrabold transition-colors line-clamp-1 tracking-tight ${
                item.isSpecial
                  ? 'text-navy-900 group-hover:text-orange font-black'
                  : 'text-slate-800 group-hover:text-orange'
              }`}
            >
              {item.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
