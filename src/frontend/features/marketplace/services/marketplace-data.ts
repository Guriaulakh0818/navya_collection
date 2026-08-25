import { cache } from 'react';

import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const getMarketplaceHomeData = cache(async () => {
  try {
    const [
      featuredShops,
      recentShops,
      trendingProducts,
      newArrivals,
      bestSellers,
      categories,
      coupons,
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
            createdAt: true,
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
          include: {
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true, verificationBadge: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 4. New Arrivals Products (Only from Approved Shops)
      prisma.product
        .findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: { status: 'APPROVED', deletedAt: null },
          },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 5. Best Sellers Products (Only from Approved Shops)
      prisma.product
        .findMany({
          where: {
            status: 'active',
            deletedAt: null,
            isFeatured: true,
            shop: { status: 'APPROVED', deletedAt: null },
          },
          take: 8,
          orderBy: { price: 'desc' },
          include: {
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

      // 7. Active Coupons
      prisma.coupon
        .findMany({
          where: { isActive: true },
          take: 2,
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            minOrderAmount: true,
          },
        })
        .catch(() => []),
    ]);

    return {
      featuredShops: featuredShops || [],
      recentShops: recentShops || [],
      trendingProducts: trendingProducts || [],
      newArrivals: newArrivals || [],
      bestSellers: bestSellers || [],
      categories: categories || [],
      coupons: coupons || [],
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
      coupons: [],
    };
  }
});
