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
    <nav className="hidden lg:flex items-center gap-7 relative">
      <Link
        href="/"
        className={`text-sm font-semibold transition-colors ${
          pathname === '/' ? 'text-navy font-bold' : 'text-brand-foreground hover:text-navy'
        }`}
      >
        Home
      </Link>

      {/* Gents Mega Menu */}
      <div
        className="relative group py-2"
        onMouseEnter={() => setActiveMenu('gents')}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link
          href="/shop?category=gents"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-foreground group-hover:text-navy transition-colors"
        >
          Gents{' '}
          <ChevronDown className="h-3.5 w-3.5 text-brand-muted group-hover:text-navy transition-transform group-hover:rotate-180" />
        </Link>

        {activeMenu === 'gents' && (
          <div className="absolute top-full left-0 w-[540px] bg-white rounded-2xl shadow-dropdown border border-brand-border p-6 grid grid-cols-3 gap-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {megaMenuData.gents.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2 text-xs text-brand-muted">
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
        className="relative group py-2"
        onMouseEnter={() => setActiveMenu('kids')}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link
          href="/shop?category=kids"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-foreground group-hover:text-navy transition-colors"
        >
          Kids{' '}
          <ChevronDown className="h-3.5 w-3.5 text-brand-muted group-hover:text-navy transition-transform group-hover:rotate-180" />
        </Link>

        {activeMenu === 'kids' && (
          <div className="absolute top-full left-0 w-[540px] bg-white rounded-2xl shadow-dropdown border border-brand-border p-6 grid grid-cols-3 gap-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {megaMenuData.kids.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2 text-xs text-brand-muted">
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-foreground hover:text-navy transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-orange" />
        New Arrivals
      </Link>

      <Link
        href="/shop?filter=offers"
        className="text-sm font-semibold text-orange hover:text-orange-600 transition-colors"
      >
        Offers
      </Link>

      <Link
        href="/shop"
        className="text-sm font-semibold text-brand-foreground hover:text-navy transition-colors"
      >
        All Products
      </Link>
    </nav>
  );
}
