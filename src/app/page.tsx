import { Building2, ChevronRight, Grid, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. HERO SECTION */}
        <MarketplaceHero />

        {/* 2. PROMOTIONAL OFFERS BANNER */}
        {coupons.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-xs">
                %
              </div>
              <div>
                <h3 className="font-extrabold text-navy text-base">Marketplace Festive Deal</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Save up to ₹{Number(coupons[0]?.discountValue || 500)} OFF on your first couture
                  purchase!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-white border border-amber-300 text-amber-800 font-mono font-extrabold text-xs rounded-xl shadow-xs">
                CODE: {coupons[0]?.code || 'NAVYA15'}
              </span>
              <CopyCouponButton code={coupons[0]?.code || 'NAVYA15'} />
            </div>
          </div>
        )}

        {/* 3. CATEGORIES SHOWCASE */}
        {categories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                    Explore Categories
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Browse Indian ethnic couture, gents garments, and kids collections.
                </p>
              </div>

              <Link
                href="/category"
                className="text-xs text-amber-700 font-extrabold flex items-center gap-1 hover:text-amber-600"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold group-hover:scale-110 transition-transform shadow-xs">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy text-sm group-hover:text-amber-600 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold">
                      {cat._count?.products || 10}+ Items
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. FEATURED SHOPS GRID */}
        <FeaturedShopsGrid shops={featuredShops} />

        {/* 5. TRENDING PRODUCTS GRID */}
        {trendingProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                    Trending Marketplace Items
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Top-rated customer favorites from our partner boutiques.
                </p>
              </div>

              <Link
                href="/shop"
                className="text-xs text-amber-700 font-extrabold flex items-center gap-1 hover:text-amber-600"
              >
                Explore All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col shadow-xs"
                >
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {p.images?.[0]?.imageUrl ? (
                      <Image
                        src={p.images[0].imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}

                    {/* Shop Badge Pill */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-extrabold text-slate-800 border border-slate-200 flex items-center gap-1 shadow-xs">
                      <Building2 className="w-3 h-3 text-amber-600" />
                      {p.shop?.name || 'Navya Store'}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-extrabold text-navy text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {p.category?.name || 'Couture'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base font-extrabold text-emerald-700 font-mono">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-amber-700 font-extrabold group-hover:translate-x-1 transition-transform">
                        Buy Now →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 6. NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                    New Arrivals Season 2026
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Freshly listed designer outfits added today across all vendor shops.
                </p>
              </div>

              <Link
                href="/shop?filter=new"
                className="text-xs text-amber-700 font-extrabold flex items-center gap-1 hover:text-amber-600"
              >
                View New Listings <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col shadow-xs"
                >
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {p.images?.[0]?.imageUrl ? (
                      <Image
                        src={p.images[0].imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full shadow-xs">
                      NEW
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-extrabold text-navy text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {p.shop?.name || 'Boutique Partner'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base font-extrabold text-amber-700 font-mono">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-amber-700 font-extrabold">Shop Now →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. RECENTLY ADDED SHOPS SPOTLIGHT */}
        <RecentlyAddedShops shops={recentShops} />
      </div>
    </div>
  );
}
