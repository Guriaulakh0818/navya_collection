import { Building2, Grid, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { HorizontalCarousel } from '@/frontend/components/ui/HorizontalCarousel';
import { CopyCouponButton } from '@/frontend/features/marketplace/components/CopyCouponButton';
import { FeaturedShopsGrid } from '@/frontend/features/marketplace/components/FeaturedShopsGrid';
import { MarketplaceHero } from '@/frontend/features/marketplace/components/MarketplaceHero';
import { RecentlyAddedShops } from '@/frontend/features/marketplace/components/RecentlyAddedShops';
import { getMarketplaceHomeData } from '@/frontend/features/marketplace/services/marketplace-data';

export const revalidate = 60; // Incremental Static Revalidation (ISR) every 60 seconds

export default async function MultiVendorMarketplaceHomePage() {
  const data = await getMarketplaceHomeData();

  const featuredShops = data?.featuredShops || [];
  const recentShops = data?.recentShops || [];
  const trendingProducts = data?.trendingProducts || [];
  const newArrivals = data?.newArrivals || [];
  const categories = data?.categories || [];
  const coupons = data?.coupons || [];

  // JSON-LD SEO Structured Data
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Navya Collection Multi-Vendor Marketplace',
    url: 'https://navyacollection.store',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://navyacollection.store/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* 1. HERO SECTION */}
        <MarketplaceHero />

        {/* 2. PROMOTIONAL OFFERS BANNER */}
        {coupons.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-xs shrink-0">
                %
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-sm sm:text-base">
                  Marketplace Festive Deal
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Save up to ₹{Number(coupons[0]?.discountValue || 500)} OFF on your first couture
                  purchase!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-mono font-extrabold text-xs rounded-xl shadow-xs">
                CODE: {coupons[0]?.code || 'NAVYA15'}
              </span>
              <CopyCouponButton code={coupons[0]?.code || 'NAVYA15'} />
            </div>
          </div>
        )}

        {/* 3. EXPLORE CATEGORIES HORIZONTAL CAROUSEL */}
        {categories.length > 0 && (
          <HorizontalCarousel
            title="Explore Categories"
            subtitle="Browse Indian ethnic couture, gents garments, and kids collections."
            icon={<Grid className="w-5 h-5 text-amber-600" />}
            actionLink="/category"
            actionText="View All"
          >
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 w-[150px] xs:w-[170px] sm:w-[200px] shrink-0 snap-start"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold group-hover:scale-110 transition-transform shadow-xs">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy text-xs sm:text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {cat._count?.products || 10}+ Items
                  </span>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        )}

        {/* 4. FEATURED SHOPS CAROUSEL */}
        <FeaturedShopsGrid shops={featuredShops} />

        {/* 5. TRENDING PRODUCTS CAROUSEL */}
        {trendingProducts.length > 0 && (
          <HorizontalCarousel
            title="Trending Marketplace Items"
            subtitle="Top-rated customer favorites from our partner boutiques."
            icon={<Sparkles className="w-5 h-5 text-amber-600" />}
            actionLink="/shop"
            actionText="Explore All"
          >
            {trendingProducts.map((p: any) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col shadow-xs w-[200px] xs:w-[225px] sm:w-[250px] shrink-0 snap-start"
              >
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  {p.images?.[0]?.imageUrl ? (
                    <Image
                      src={p.images[0].imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 220px, 250px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Tag className="w-10 h-10" />
                    </div>
                  )}

                  {/* Shop Badge Pill */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-extrabold text-slate-800 border border-slate-200 flex items-center gap-1 shadow-xs truncate max-w-[85%]">
                    <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">{p.shop?.name || 'Navya Store'}</span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-extrabold text-navy text-xs sm:text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {p.category?.name || 'Couture'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono">
                      ₹{Number(p.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-amber-700 font-extrabold group-hover:translate-x-0.5 transition-transform">
                      Buy →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        )}

        {/* 6. NEW ARRIVALS CAROUSEL */}
        {newArrivals.length > 0 && (
          <HorizontalCarousel
            title="New Arrivals Season 2026"
            subtitle="Freshly listed designer outfits added today across all vendor shops."
            icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
            actionLink="/shop?filter=new"
            actionText="View New Listings"
          >
            {newArrivals.map((p: any) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col shadow-xs w-[200px] xs:w-[225px] sm:w-[250px] shrink-0 snap-start"
              >
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  {p.images?.[0]?.imageUrl ? (
                    <Image
                      src={p.images[0].imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 220px, 250px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Tag className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full shadow-xs">
                    NEW
                  </span>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-extrabold text-navy text-xs sm:text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {p.shop?.name || 'Boutique Partner'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm sm:text-base font-extrabold text-amber-700 font-mono">
                      ₹{Number(p.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-amber-700 font-extrabold">Shop →</span>
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        )}

        {/* 7. RECENTLY ADDED SHOPS SPOTLIGHT */}
        <RecentlyAddedShops shops={recentShops} />
      </div>
    </div>
  );
}
