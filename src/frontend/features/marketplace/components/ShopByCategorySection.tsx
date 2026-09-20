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
    id: 'trending',
    name: 'Trending Now',
    image: '/images/categories/spot-festivals-india.jpg',
    href: '/category/spotlight',
    badge: 'HOT',
    badgeBg: 'bg-rose-600',
    isSpecial: true,
  },
  {
    id: 'men',
    name: 'Men',
    image: '/images/categories/category-men.jpg',
    href: '/category/men',
  },
  {
    id: 'women',
    name: 'Women',
    image: '/images/categories/category-women.jpg',
    href: '/category/women',
  },
  {
    id: 'kids',
    name: 'Kids',
    image: '/images/categories/category-kids.jpg',
    href: '/category/kids',
  },
  {
    id: 'sarees',
    name: 'Sarees',
    image: '/images/categories/women-sarees.jpg',
    href: '/category/women-sarees',
  },
  {
    id: 'ethnic',
    name: 'Ethnic Wear',
    image: '/images/categories/men-kurtas.jpg',
    href: '/category/men-kurtas',
  },
  {
    id: 'shirts',
    name: 'Shirts',
    image: '/images/categories/men-casual-shirts.jpg',
    href: '/category/men-shirts',
  },
  {
    id: 'suits',
    name: 'Suits & Blazers',
    image: '/images/categories/men-suits.jpg',
    href: '/category/men-suits',
  },
  {
    id: 'budget',
    name: 'Under ₹999',
    image: '/images/categories/spot-budget-finds.jpg',
    href: '/category/under-999',
    badge: 'DEAL',
    badgeBg: 'bg-amber-600',
    isSpecial: true,
  },
];

export function ShopByCategorySection() {
  return (
    <section className="space-y-4 sm:space-y-5 my-6 sm:my-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-[#F28C28]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0A2342] tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Find exactly what you&apos;re looking for
            </p>
          </div>
        </div>

        <Link
          href="/category"
          className="text-xs sm:text-sm font-extrabold text-[#F28C28] hover:text-[#d97718] transition-colors flex items-center gap-1 shrink-0"
        >
          <span>View All Categories</span>
          <span>→</span>
        </Link>
      </div>

      {/* Circular Category Grid / Horizontal Scroll */}
      <div className="flex items-center justify-start lg:justify-between gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {CATEGORY_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col items-center text-center w-[76px] sm:w-[96px] md:w-[108px] shrink-0 transition-all duration-300 active:scale-95"
          >
            {/* Circular Avatar Container */}
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full p-1 border-2 transition-all duration-300 flex items-center justify-center ${
                item.isSpecial
                  ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                  : 'border-slate-200/90 bg-white group-hover:border-[#F28C28] group-hover:shadow-md'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 64px, 96px"
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Special Badge (e.g. HOT on Trending, DEAL on Under ₹999) */}
              {item.badge && (
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                    item.badgeBg || 'bg-rose-600'
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
                  ? 'text-amber-900 group-hover:text-[#F28C28]'
                  : 'text-[#0A2342] group-hover:text-[#F28C28]'
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
