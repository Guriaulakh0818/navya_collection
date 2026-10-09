'use client';

import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const megaCategoriesData = [
  {
    title: 'In The Spotlight',
    href: '/category/spotlight',
    items: [
      { name: 'Festivals of India', href: '/category/festivals-of-india' },
      { name: 'New Season Drops', href: '/category/new-season' },
      { name: 'Trending Now', href: '/category/trending' },
      { name: 'Best Sellers', href: '/category/best-sellers' },
      { name: 'Top-Rated Styles', href: '/category/top-rated' },
      { name: 'Budget Finds (Under ₹999)', href: '/category/budget-finds' },
      { name: 'Korean Store', href: '/category/korean-store' },
      { name: 'Sports Store', href: '/category/sports-store' },
    ],
  },
  {
    title: 'Men',
    href: '/category/men',
    items: [
      { name: 'Shirts', href: '/category/men-shirts' },
      { name: 'T-Shirts & Polos', href: '/category/men-t-shirts' },
      { name: 'Jeans & Denims', href: '/category/men-jeans' },
      { name: 'Trousers & Chinos', href: '/category/men-chinos' },
      { name: 'Kurtas & Sets', href: '/category/men-kurta-sets' },
      { name: 'Blazers & Suits', href: '/category/men-blazers' },
      { name: 'Track Pants & Active', href: '/category/men-track-pants' },
      { name: 'Watches & Accessories', href: '/category/men-watches' },
    ],
  },
  {
    title: 'Women',
    href: '/category/women',
    items: [
      { name: 'Sarees', href: '/category/women-sarees' },
      { name: 'Lehenga Choli', href: '/category/women-lehengas' },
      { name: 'Kurta Sets & Suits', href: '/category/women-kurta-sets' },
      { name: 'Kurtas & Tunics', href: '/category/women-kurtas' },
      { name: 'Western Dresses', href: '/category/women-dresses' },
      { name: 'Tops & Tees', href: '/category/women-tops-tees' },
      { name: 'Handbags & Clutches', href: '/category/women-bags' },
      { name: 'Winter Outerwear', href: '/category/women-jackets' },
    ],
  },
  {
    title: 'Kids',
    href: '/category/kids',
    items: [
      { name: 'Baby Newborn & Sets', href: '/category/baby-fashion' },
      { name: 'Boys Clothing', href: '/category/boys-fashion' },
      { name: 'Girls Clothing', href: '/category/girls-fashion' },
      { name: 'Teen Trends', href: '/category/teens-fashion' },
      { name: 'Kids Ethnic Wear', href: '/category/kids-ethnic-wear' },
      { name: 'Kids Essentials', href: '/category/kids-essentials' },
      { name: 'All Kids Fashion', href: '/category/all-kids-fashion' },
    ],
  },
  {
    title: 'Shops',
    href: '/shops',
    items: [
      { name: 'All Partner Boutiques', href: '/shops' },
      { name: 'Trending Shops', href: '/category/trending-shops' },
      { name: 'Top-Rated Boutiques', href: '/category/top-rated-shops' },
      { name: 'New Boutiques', href: '/category/new-shops' },
    ],
  },
];

export function HeaderNavigation() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<'categories' | null>(null);

  const isCategoriesActive = pathname.startsWith('/category') || pathname.includes('category=');

  return (
    <nav className="hidden lg:flex items-center gap-1.5 lg:gap-2.5 xl:gap-4 2xl:gap-6 relative">
      <Link
        href="/"
        className={`text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
          pathname === '/' ? 'text-navy font-bold' : 'text-slate-700 hover:text-navy'
        }`}
      >
        Home
      </Link>

      {/* Single Categories Mega Menu */}
      <div
        className="relative py-2"
        onMouseEnter={() => setActiveMenu('categories')}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link
          href="/category"
          className={`inline-flex items-center gap-1 text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
            isCategoriesActive ? 'text-navy font-bold' : 'text-slate-700 hover:text-navy'
          }`}
        >
          <span>Categories</span>{' '}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              activeMenu === 'categories' ? 'rotate-180 text-navy' : ''
            }`}
          />
        </Link>

        {activeMenu === 'categories' && (
          <div className="absolute top-full -left-12 xl:left-0 w-[880px] bg-white rounded-2xl shadow-dropdown border border-slate-100 p-6 grid grid-cols-5 gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {megaCategoriesData.map((categoryGroup) => (
              <div key={categoryGroup.title}>
                <Link
                  href={categoryGroup.href}
                  className="group flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy mb-3 hover:text-orange transition-colors"
                >
                  <span>{categoryGroup.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange transition-colors" />
                </Link>
                <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                  {categoryGroup.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="hover:text-orange transition-colors block py-0.5"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/shop?filter=new"
        className="inline-flex items-center gap-1 text-xs xl:text-sm font-semibold text-slate-700 hover:text-navy transition-colors whitespace-nowrap"
      >
        <Sparkles className="h-3.5 w-3.5 text-orange shrink-0" />
        <span className="hidden xl:inline">New Arrivals</span>
        <span className="xl:hidden">New</span>
      </Link>

      <Link
        href="/shop?filter=offers"
        className="text-xs xl:text-sm font-semibold text-orange hover:text-orange-600 transition-colors whitespace-nowrap"
      >
        Offers
      </Link>

      <Link
        href="/shop"
        className={`text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
          pathname === '/shop' ? 'text-navy font-bold' : 'text-slate-700 hover:text-navy'
        }`}
      >
        Shop
      </Link>

      <Link
        href="/about"
        className={`hidden xl:block text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
          pathname === '/about' ? 'text-navy font-bold' : 'text-slate-700 hover:text-navy'
        }`}
      >
        About
      </Link>

      <Link
        href="/contact"
        className={`hidden 2xl:block text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
          pathname === '/contact' ? 'text-navy font-bold' : 'text-slate-700 hover:text-navy'
        }`}
      >
        Contact
      </Link>
    </nav>
  );
}
