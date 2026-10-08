'use client';

import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const megaCategoriesData = [
  {
    title: 'Women Ethnic',
    href: '/category/sarees',
    items: [
      { name: 'Sarees', href: '/category/sarees' },
      { name: 'Lehenga Choli', href: '/category/lehengas' },
      { name: 'Anarkalis & Suits', href: '/category/anarkalis-suits' },
      { name: 'Kurtis & Tunics', href: '/category/kurtis-tunics' },
      { name: 'Dupattas & Stoles', href: '/category/dupattas-stoles' },
      { name: 'Banarasi Sarees', href: '/category/banarasi-sarees' },
      { name: 'Bridal Lehengas', href: '/category/bridal-lehengas' },
    ],
  },
  {
    title: 'Men Couture',
    href: '/category/gents-mens-couture',
    items: [
      { name: 'Gents & Mens Couture', href: '/category/gents-mens-couture' },
      { name: 'Designer Kurta Pajamas', href: '/category/designer-kurta-pajamas' },
      { name: 'Partywear Lehengas', href: '/category/partywear-lehengas' },
      { name: 'Silk Anarkali Sets', href: '/category/silk-anarkali-sets' },
    ],
  },
  {
    title: 'Fusion & Boutiques',
    href: '/category/indo-western-fusion',
    items: [
      { name: 'Indo-Western & Fusion', href: '/category/indo-western-fusion' },
      { name: 'Kanjeevaram Silks', href: '/category/kanjeevaram-silk-sarees' },
      { name: 'Chanderi Sarees', href: '/category/chanderi-sarees' },
      { name: 'Phulkari Dupattas', href: '/category/phulkari-dupattas' },
      { name: 'All Boutiques', href: '/shops' },
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
          <div className="absolute top-full left-0 w-[640px] bg-white rounded-2xl shadow-dropdown border border-slate-100 p-6 grid grid-cols-3 gap-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
