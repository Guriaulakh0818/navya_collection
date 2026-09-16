import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin, Package, ShieldCheck, Sparkles, Star, Store } from 'lucide-react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ProductCard } from '@/features/products/components/ProductCard';
import {
  CITY_SEO_THRESHOLDS,
  formatCityDisplayName,
  generateCityJsonLdSchemas,
  generateCityMetadata,
  JsonLd,
  SEO_CONSTANTS,
  slugifyCity,
} from '@/frontend/features/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = (slug || '').toLowerCase().trim();

  try {
    const { prisma } = await import('@/lib/prisma');

    const allApprovedShops = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
    });

    const matchingShops = allApprovedShops.filter(
      (s) => s.city && slugifyCity(s.city) === cleanSlug
    );

    // 1. Must have at least 2 approved shops
    if (matchingShops.length < CITY_SEO_THRESHOLDS.MIN_APPROVED_SHOPS) {
      return {
        title: `City Not Found | ${SEO_CONSTANTS.SITE_NAME}`,
        description: 'The requested local city page is not available on Navya Collection.',
        robots: { index: false, follow: false },
      };
    }

    const cityName = matchingShops[0].city;
    const stateName = matchingShops[0].state;
    const matchingShopIds = matchingShops.map((s) => s.id);

    // 2. Must have at least 10 active products belonging to these shops
    const activeProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        shopId: { in: matchingShopIds },
        shop: {
          status: 'APPROVED',
          deletedAt: null,
        },
      },
      select: {
        id: true,
        category: {
          select: {
            id: true,
            slug: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (activeProducts.length < CITY_SEO_THRESHOLDS.MIN_ACTIVE_PRODUCTS) {
      return {
        title: `City Not Found | ${SEO_CONSTANTS.SITE_NAME}`,
        description: 'The requested local city page is not available on Navya Collection.',
        robots: { index: false, follow: false },
      };
    }

    // 3. Must have at least 2 distinct active categories represented
    const distinctCategories = new Set<string>();
    for (const p of activeProducts) {
      if (
        p.category &&
        p.category.slug &&
        p.category.status === 'active' &&
        p.category.deletedAt === null
      ) {
        distinctCategories.add(p.category.slug);
      }
    }

    if (distinctCategories.size < CITY_SEO_THRESHOLDS.MIN_ACTIVE_CATEGORIES) {
      return {
        title: `City Not Found | ${SEO_CONSTANTS.SITE_NAME}`,
        description: 'The requested local city page is not available on Navya Collection.',
        robots: { index: false, follow: false },
      };
    }

    return generateCityMetadata({
      cityName,
      stateName,
      citySlug: cleanSlug,
      approvedShopCount: matchingShops.length,
      activeProductCount: activeProducts.length,
      categories: [],
      isIndexable: true,
    });
  } catch (error) {
    console.error('Failed to generate city metadata:', error);
    return {
      title: `Local Stores | ${SEO_CONSTANTS.SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }
}

export default async function CityMarketplacePage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = (slug || '').toLowerCase().trim();

  let matchingShops: any[] = [];
  let cityProducts: any[] = [];
  let cityCategories: any[] = [];
  let cityName = formatCityDisplayName(cleanSlug);
  let stateName = '';

  try {
    const { prisma } = await import('@/lib/prisma');

    const allApprovedShops = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        banner: true,
        city: true,
        state: true,
        pincode: true,
        rating: true,
        reviewCount: true,
        verificationBadge: true,
        _count: {
          select: {
            products: {
              where: { status: 'active', deletedAt: null },
            },
          },
        },
      },
      orderBy: { rating: 'desc' },
    });

    matchingShops = allApprovedShops.filter(
      (s) => s.city && slugifyCity(s.city) === cleanSlug
    );

    // Rule 1: Shop count >= 2
    if (matchingShops.length < CITY_SEO_THRESHOLDS.MIN_APPROVED_SHOPS) {
      notFound();
    }

    cityName = matchingShops[0].city;
    stateName = matchingShops[0].state || '';
    const matchingShopIds = matchingShops.map((s) => s.id);

    // Multi-tenant safe: only products belonging to approved shops in this city
    const rawProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        shopId: { in: matchingShopIds },
        shop: {
          status: 'APPROVED',
          deletedAt: null,
        },
      },
      include: {
        images: {
          select: { id: true, imageUrl: true, isPrimary: true, altText: true },
          orderBy: { isPrimary: 'desc' },
        },
        shop: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, status: true, deletedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Rule 2: Active Product count >= 10
    if (rawProducts.length < CITY_SEO_THRESHOLDS.MIN_ACTIVE_PRODUCTS) {
      notFound();
    }

    // Extract unique active categories available from sellers in this city
    const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    for (const p of rawProducts) {
      if (
        p.category &&
        p.category.slug &&
        p.category.status === 'active' &&
        p.category.deletedAt === null
      ) {
        const existing = categoryMap.get(p.category.slug);
        if (existing) {
          existing.count += 1;
        } else {
          categoryMap.set(p.category.slug, {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            count: 1,
          });
        }
      }
    }
    cityCategories = Array.from(categoryMap.values());

    // Rule 3: Distinct active Category count >= 2
    if (cityCategories.length < CITY_SEO_THRESHOLDS.MIN_ACTIVE_CATEGORIES) {
      notFound();
    }

    cityProducts = rawProducts.slice(0, 24).map((p) => {
      const primary = p.images.find((img) => img.isPrimary) || p.images[0];
      return {
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        images: p.images.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          alt: img.altText || p.name,
        })),
        imageUrl: primary?.imageUrl,
      };
    });
  } catch (error) {
    console.error('Failed to load city marketplace data:', error);
    notFound();
  }

  const locationDisplay = stateName ? `${cityName}, ${stateName}` : cityName;
  const canonicalUrl = `${SEO_CONSTANTS.SITE_URL}/city/${cleanSlug}`;

  const jsonLdSchemas = generateCityJsonLdSchemas({
    cityName,
    stateName,
    canonicalUrl,
    shops: matchingShops,
    products: cityProducts,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* City Structured Data */}
      <JsonLd data={jsonLdSchemas} />

      <div className="bg-white border-b border-slate-200">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Marketplace Shops', href: '/shop' },
            { label: cityName },
          ]}
          className="mx-auto max-w-7xl px-4 md:px-6 py-3"
        />
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-navy to-[#183A73] text-white py-10 md:py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/10 backdrop-blur-xs">
            <MapPin className="w-3.5 h-3.5" />
            <span>Local Marketplace Discovery</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Local Fashion Stores in {cityName}
          </h1>
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
            Explore authentic fashion collections and products from verified clothing boutiques in{' '}
            <strong className="text-white">{locationDisplay}</strong> available on Navya Collection.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 sm:py-10 space-y-10">
        {/* Available Categories Pills in this City */}
        {cityCategories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              Categories Available in {cityName}
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {cityCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-500 hover:text-amber-600 shadow-2xs transition-all shrink-0"
                >
                  <span>{cat.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                    {cat.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Local Verified Shops Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                Verified Partner Boutiques in {cityName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {matchingShops.length} {matchingShops.length === 1 ? 'store' : 'stores'} registered in this city
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchingShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 relative overflow-hidden">
                    {shop.logo ? (
                      <Image
                        src={shop.logo}
                        alt={shop.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-navy text-base group-hover:text-amber-600 transition-colors truncate">
                        {shop.name}
                      </h3>
                      {shop.verificationBadge && shop.verificationBadge !== 'NONE' && (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {shop.city}, {shop.state}
                    </p>
                    {shop.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{shop.rating.toFixed(1)}</span>
                        {shop.reviewCount > 0 && (
                          <span className="text-slate-400 text-[10px]">({shop.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    {shop._count?.products || 0} Products
                  </span>
                  <span className="font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Visit Store <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Local Products Section */}
        {cityProducts.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Popular Products from {cityName} Stores
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct from verified local merchants in {cityName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {cityProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
