'use client';

import { ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const megaMenuData = {
  gents: [
    {
      title: 'Top Wear',
      items: ['Casual Shirts', 'Formal Shirts', 'Kurtas & Pyjamas', 'Polo T-Shirts', 'Blazers'],
    },
    {
      title: 'Bottom Wear',
      items: ['Slim Fit Chinos', 'Formal Trousers', 'Casual Shorts', 'Jeans'],
    },
    {
      title: 'Trending Now',
      items: ['Festive Ethnic Kurta', 'Linen Blend Shirts', 'Classic Navy Blazer'],
    },
  ],
  kids: [
    {
      title: 'Boys Collection',
      items: ['Printed T-Shirts', 'Casual Shirts', 'Ethnic Kurta Sets', 'Jackets & Hoodies'],
    },
    {
      title: 'Girls & Infants',
      items: ['Party Dresses', 'Cute Frocks', 'Infant Bodysuits', 'Soft Cotton Sets'],
    },
    { title: 'Age Group', items: ['0-2 Years', '3-6 Years', '7-12 Years', '13-16 Years'] },
  ],
};

export function HeaderNavigation() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<'gents' | 'kids' | null>(null);

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

      {/* Gents Mega Menu */}
      <div
        className="relative py-2"
        onMouseEnter={() => setActiveMenu('gents')}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link
          href="/shop?category=gents"
          className={`inline-flex items-center gap-1 text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
            pathname.includes('category=gents')
              ? 'text-navy font-bold'
              : 'text-slate-700 hover:text-navy'
          }`}
        >
          <span className="hidden 2xl:inline">Gents Garments</span>
          <span className="2xl:hidden">Gents</span>{' '}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              activeMenu === 'gents' ? 'rotate-180 text-navy' : ''
            }`}
          />
        </Link>

        {activeMenu === 'gents' && (
          <div className="absolute top-full left-0 w-[540px] bg-white rounded-2xl shadow-dropdown border border-slate-100 p-6 grid grid-cols-3 gap-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {megaMenuData.gents.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Link
                        href={`/shop?category=gents&sub=${encodeURIComponent(item)}`}
                        className="hover:text-orange transition-colors block py-0.5"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kids Mega Menu */}
      <div
        className="relative py-2"
        onMouseEnter={() => setActiveMenu('kids')}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link
          href="/shop?category=kids"
          className={`inline-flex items-center gap-1 text-xs xl:text-sm font-semibold transition-colors whitespace-nowrap ${
            pathname.includes('category=kids')
              ? 'text-navy font-bold'
              : 'text-slate-700 hover:text-navy'
          }`}
        >
          <span className="hidden 2xl:inline">Kids Garments</span>
          <span className="2xl:hidden">Kids</span>{' '}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              activeMenu === 'kids' ? 'rotate-180 text-navy' : ''
            }`}
          />
        </Link>

        {activeMenu === 'kids' && (
          <div className="absolute top-full left-0 w-[540px] bg-white rounded-2xl shadow-dropdown border border-slate-100 p-6 grid grid-cols-3 gap-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {megaMenuData.kids.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Link
                        href={`/shop?category=kids&sub=${encodeURIComponent(item)}`}
                        className="hover:text-navy transition-colors block py-0.5"
                      >
                        {item}
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
