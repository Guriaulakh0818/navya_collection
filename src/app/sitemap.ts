import { MetadataRoute } from 'next';

import { CITY_SEO_THRESHOLDS, slugifyCity } from '@/features/seo';
import { CATEGORIES } from '@/frontend/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

/**
 * Dynamic Production XML Sitemap Generator for Navya Collection Marketplace.
 * Emits canonical, indexable public URLs across:
 * - Core Hub & Marketplace Explorer Pages
 * - Public Content & Legal Policy Pages
 * - Public Category & Subcategory Hubs
 * - Approved Verified Boutique Storefronts (status === 'APPROVED', deletedAt: null)
 * - Active Public Marketplace Products (status === 'active', deletedAt: null)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store').replace(
    /\/+$/,
    '',
  );

  const now = new Date();

  // 1. Core Public Navigation & Content Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/become-seller`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cancellation-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/seller-agreement`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Canonical Public Categories with Public Products ONLY
  const categoryMap = new Map<string, Date>();
  let dbCategories: Array<{ slug: string; updatedAt: Date }> = [];
  let dbShops: Array<{ slug: string; updatedAt: Date }> = [];
  let dbProducts: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    // Query active database categories with at least 1 public product
    dbCategories = await prisma.category.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        products: {
          some: {
            status: 'active',
            deletedAt: null,
            OR: [
              { shopId: null },
              {
                shop: {
                  status: 'APPROVED',
                  deletedAt: null,
                },
              },
            ],
          },
        },
      },
      select: { slug: true, updatedAt: true },
    });

    for (const cat of dbCategories) {
      if (cat.slug && cat.slug !== 'all') {
        categoryMap.set(cat.slug.toLowerCase().trim(), cat.updatedAt || now);
      }
    }
  } catch (error) {
    console.warn('[Sitemap] Database categories query fallback:', error);
  }

  const categoryUrls: MetadataRoute.Sitemap = Array.from(categoryMap.entries()).map(
    ([slug, lastMod]) => ({
      url: `${baseUrl}/category/${slug}`,
      lastModified: lastMod,
      changeFrequency: 'daily',
      priority: 0.8,
    }),
  );

  try {
    // 3. Approved & Active Boutique Storefronts with public products ONLY
    dbShops = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        products: {
          some: {
            status: 'active',
            deletedAt: null,
          },
        },
      },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.warn('[Sitemap] Database shops query fallback:', error);
  }

  const shopUrls: MetadataRoute.Sitemap = dbShops.map((s) => ({
    url: `${baseUrl}/shop/${s.slug}`,
    lastModified: s.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  try {
    // 4. Active Public Products ONLY (No 1000-take limit, filtered for public safety)
    dbProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        OR: [
          { shopId: null },
          {
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
          },
        ],
      },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.warn('[Sitemap] Database products query fallback:', error);
  }

  const productUrls: MetadataRoute.Sitemap = dbProducts.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 5. Eligible City Marketplace Discovery Hubs ONLY
  // Strict Indexability Rule: approvedShopCount >= 2 && activeProductCount >= 10 && activeCategoryCount >= 2
  const cityMap = new Map<string, Date>();
  try {
    const allApprovedShops = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        city: { not: '' },
      },
      select: {
        id: true,
        city: true,
        updatedAt: true,
      },
    });

    const shopsByCitySlug = new Map<string, Array<{ id: string; city: string; updatedAt: Date }>>();
    for (const shop of allApprovedShops) {
      if (shop.city && shop.city.trim().length > 0) {
        const cSlug = slugifyCity(shop.city);
        if (cSlug) {
          const list = shopsByCitySlug.get(cSlug) || [];
          list.push(shop);
          shopsByCitySlug.set(cSlug, list);
        }
      }
    }

    for (const [cSlug, cityShops] of shopsByCitySlug.entries()) {
      // 1. Minimum 2 approved shops
      if (cityShops.length >= CITY_SEO_THRESHOLDS.MIN_APPROVED_SHOPS) {
        const shopIds = cityShops.map((s) => s.id);

        // 2. Minimum 10 active products belonging to these approved shops
        const activeProducts = await prisma.product.findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shopId: { in: shopIds },
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
          },
          select: {
            id: true,
            updatedAt: true,
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

        if (activeProducts.length >= CITY_SEO_THRESHOLDS.MIN_ACTIVE_PRODUCTS) {
          // 3. Minimum 2 distinct active categories represented
          const distinctCatSlugs = new Set<string>();
          let latestDate = now;

          for (const s of cityShops) {
            if (s.updatedAt && s.updatedAt > latestDate) {
              latestDate = s.updatedAt;
            }
          }

          for (const p of activeProducts) {
            if (
              p.category &&
              p.category.slug &&
              p.category.status === 'active' &&
              p.category.deletedAt === null
            ) {
              distinctCatSlugs.add(p.category.slug);
            }
            if (p.updatedAt && p.updatedAt > latestDate) {
              latestDate = p.updatedAt;
            }
          }

          if (distinctCatSlugs.size >= CITY_SEO_THRESHOLDS.MIN_ACTIVE_CATEGORIES) {
            cityMap.set(cSlug, latestDate);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[Sitemap] Database city pages query fallback:', error);
  }

  const cityUrls: MetadataRoute.Sitemap = Array.from(cityMap.entries()).map(([slug, lastMod]) => ({
    url: `${baseUrl}/city/${slug}`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryUrls, ...shopUrls, ...productUrls, ...cityUrls];
}
