import { cache } from 'react';

import { OfferService } from '@/backend/services/offer.service';
import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

const safeCache = typeof cache === 'function' ? cache : (fn: any) => fn;

function sanitizeProduct(p: any) {
  if (!p) return null;
  return {
    id: String(p.id),
    name: String(p.name || ''),
    slug: String(p.slug || ''),
    price: Number(p.price || 0),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : null,
    reviewCount: p.reviewCount ? Number(p.reviewCount) : 0,
    images: (p.images || []).map((img: any) => ({
      imageUrl: img.imageUrl || img.url || null,
      url: img.imageUrl || img.url || null,
    })),
    shop: p.shop
      ? {
          id: String(p.shop.id),
          name: String(p.shop.name || ''),
          slug: String(p.shop.slug || ''),
          logo: p.shop.logo || null,
          verificationBadge: p.shop.verificationBadge || 'NONE',
        }
      : null,
    category: p.category
      ? {
          id: String(p.category.id),
          name: String(p.category.name || ''),
          slug: String(p.category.slug || ''),
        }
      : null,
  };
}

function sanitizeShop(s: any) {
  if (!s) return null;
  return {
    id: String(s.id),
    name: String(s.name || ''),
    slug: String(s.slug || ''),
    logo: s.logo || null,
    banner: s.banner || null,
    rating: s.rating !== null && s.rating !== undefined ? Number(s.rating) : null,
    reviewCount: s.reviewCount ? Number(s.reviewCount) : 0,
    verificationBadge: s.verificationBadge || 'NONE',
    city: s.city || null,
    state: s.state || null,
    _count: {
      products: s._count?.products ? Number(s._count.products) : 0,
    },
    products: (s.products || []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name || ''),
      images: (p.images || []).map((img: any) => ({
        imageUrl: img.imageUrl || img.url || null,
      })),
    })),
  };
}

function sanitizeOffer(o: any) {
  if (!o) return null;
  return {
    id: String(o.id),
    title: String(o.title || ''),
    description: o.description || null,
    type: String(o.type || 'FREE_DELIVERY'),
    value: Number(o.value || 0),
    minCartValue: o.minCartValue ? Number(o.minCartValue) : null,
    firstOrderOnly: Boolean(o.firstOrderOnly),
    isActive: Boolean(o.isActive),
  };
}

export const getMarketplaceHomeData = safeCache(async () => {
  try {
    const [
      featuredShops,
      recentShops,
      trendingProducts,
      newArrivals,
      bestSellers,
      categories,
      offers,
    ] = await Promise.all([
      // 1. Featured Shops
      prisma.shop
        .findMany({
          where: { status: 'APPROVED', deletedAt: null },
          take: 6,
          orderBy: { rating: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            banner: true,
            rating: true,
            reviewCount: true,
            verificationBadge: true,
            city: true,
            state: true,
            _count: {
              select: { products: { where: { deletedAt: null, status: 'active' } } },
            },
            products: {
              where: { deletedAt: null, status: 'active' },
              take: 4,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                images: { select: { imageUrl: true }, take: 1 },
              },
            },
          },
        })
        .catch(() => []),

      // 2. Recently Added Shops
      prisma.shop
        .findMany({
          where: { status: 'APPROVED', deletedAt: null },
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            verificationBadge: true,
            city: true,
            state: true,
          },
        })
        .catch(() => []),

      // 3. Trending Products (Only from Approved Shops)
      prisma.product
        .findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: { status: 'APPROVED', deletedAt: null },
          },
          take: 8,
          orderBy: { rating: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            rating: true,
            reviewCount: true,
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true, verificationBadge: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 4. New Arrivals Products (Only from Approved Active Shops)
      prisma.product
        .findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: { status: 'APPROVED', deletedAt: null },
          },
          take: 12,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            rating: true,
            reviewCount: true,
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 5. Best Sellers Products (Only from Approved Active Shops)
      prisma.product
        .findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: { status: 'APPROVED', deletedAt: null },
          },
          take: 12,
          orderBy: { price: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            rating: true,
            reviewCount: true,
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 6. Active Primary Categories
      prisma.category
        .findMany({
          where: { parentId: null, deletedAt: null },
          take: 8,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            _count: {
              select: {
                products: {
                  where: {
                    deletedAt: null,
                    status: 'active',
                    shop: {
                      status: 'APPROVED',
                      deletedAt: null,
                    },
                  },
                },
              },
            },
          },
        })
        .then((cats) =>
          cats.length > 0
            ? cats
            : CATEGORIES.map((cat) => ({
                ...cat,
                _count: { products: 0 },
              })),
        )
        .catch(() =>
          CATEGORIES.map((cat) => ({
            ...cat,
            _count: { products: 0 },
          })),
        ),

      // 7. Active Configured Offers / Promotions
      OfferService.getActiveOffers().catch(() => []),
    ]);

    const isNonNullable = <T>(val: T): val is NonNullable<T> => Boolean(val);

    return {
      featuredShops: (featuredShops || []).map(sanitizeShop).filter(isNonNullable),
      recentShops: (recentShops || []).map(sanitizeShop).filter(isNonNullable),
      trendingProducts: (trendingProducts || []).map(sanitizeProduct).filter(isNonNullable),
      newArrivals: (newArrivals || []).map(sanitizeProduct).filter(isNonNullable),
      bestSellers: (bestSellers || []).map(sanitizeProduct).filter(isNonNullable),
      categories: (categories || []).map((c: any) => ({
        id: String(c.id),
        name: String(c.name || ''),
        slug: String(c.slug || ''),
        image: c.image || null,
        _count: {
          products: c._count?.products ? Number(c._count.products) : 0,
        },
      })),
      offers: (offers || []).map(sanitizeOffer).filter(isNonNullable),
    };
  } catch (error) {
    console.error('❌ Failed to fetch marketplace home data:', error);
    return {
      featuredShops: [],
      recentShops: [],
      trendingProducts: [],
      newArrivals: [],
      bestSellers: [],
      categories: [],
      offers: [],
    };
  }
});
