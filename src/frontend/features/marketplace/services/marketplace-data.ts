import { cache } from 'react';

import { CATEGORIES } from '@/features/categories/constants/category.constants';
import { prisma } from '@/lib/prisma';

export const getMarketplaceHomeData = cache(async () => {
  const fallbackShops = [
    {
      id: 'shop_navya',
      name: 'Navya Collection',
      slug: 'navya-collection',
      logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400',
      banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
      rating: 4.8,
      reviewCount: 120,
      verificationBadge: 'PREMIUM_STORE',
      city: 'Hisar',
      state: 'Haryana',
      createdAt: new Date(),
      _count: { products: 45 },
    },
    {
      id: 'shop_saniya_fashions',
      name: 'Saniya Fashions',
      slug: 'saniya-fashions',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
      rating: 4.9,
      reviewCount: 45,
      verificationBadge: 'VERIFIED_SELLER',
      city: 'Chandigarh',
      state: 'Punjab',
      createdAt: new Date(),
      _count: { products: 32 },
    },
    {
      id: 'shop_style_zone',
      name: 'Style Zone',
      slug: 'style-zone',
      logo: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400',
      banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
      rating: 4.7,
      reviewCount: 32,
      verificationBadge: 'TRUSTED_SELLER',
      city: 'Sirsa',
      state: 'Haryana',
      createdAt: new Date(),
      _count: { products: 28 },
    },
    {
      id: 'shop_jaspreet_fashions',
      name: 'Jaspreet Fashions',
      slug: 'jaspreet-fashions',
      logo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      rating: 4.9,
      reviewCount: 88,
      verificationBadge: 'PREMIUM_STORE',
      city: 'Ludhiana',
      state: 'Punjab',
      createdAt: new Date(),
      _count: { products: 36 },
    },
    {
      id: 'shop_barkat_fashion',
      name: 'Barkat Fashion',
      slug: 'barkat-fashion',
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200',
      rating: 4.8,
      reviewCount: 64,
      verificationBadge: 'VERIFIED_SELLER',
      city: 'Amritsar',
      state: 'Punjab',
      createdAt: new Date(),
      _count: { products: 24 },
    },
  ];

  const fallbackProducts = [
    {
      id: 'p1',
      name: 'Royal Banarasi Silk Handloom Saree',
      slug: 'royal-banarasi-silk-saree-1',
      price: 14999,
      rating: 4.9,
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' }],
      shop: {
        id: 'shop_navya',
        name: 'Navya Collection',
        slug: 'navya-collection',
        verificationBadge: 'PREMIUM_STORE',
      },
      category: { id: 'c1', name: 'Banarasi Sarees', slug: 'banarasi-sarees' },
    },
    {
      id: 'p2',
      name: 'Emerald Heavy Velvet Bridal Lehenga',
      slug: 'emerald-velvet-bridal-lehenga-2',
      price: 45999,
      rating: 4.9,
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800' }],
      shop: {
        id: 'shop_saniya_fashions',
        name: 'Saniya Fashions',
        slug: 'saniya-fashions',
        verificationBadge: 'VERIFIED_SELLER',
      },
      category: { id: 'c2', name: 'Bridal Lehengas', slug: 'bridal-lehengas' },
    },
    {
      id: 'p3',
      name: 'Designer Royal Velvet Sherwani Set',
      slug: 'designer-velvet-sherwani-set-3',
      price: 28999,
      rating: 4.7,
      images: [{ imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800' }],
      shop: {
        id: 'shop_style_zone',
        name: 'Style Zone',
        slug: 'style-zone',
        verificationBadge: 'TRUSTED_SELLER',
      },
      category: { id: 'c3', name: 'Gents Couture', slug: 'gents-mens-couture' },
    },
  ];

  const fallbackCategories = [
    {
      id: 'cat_anarkali',
      name: 'Anarkalis & Suits',
      slug: 'anarkalis-suits',
      image: '',
      _count: { products: 12 },
    },
    {
      id: 'cat_banarasi',
      name: 'Banarasi Sarees',
      slug: 'banarasi-sarees',
      image: '',
      _count: { products: 15 },
    },
    {
      id: 'cat_bridal',
      name: 'Bridal Lehengas',
      slug: 'bridal-lehengas',
      image: '',
      _count: { products: 10 },
    },
    {
      id: 'cat_gents',
      name: 'Gents & Mens Couture',
      slug: 'gents-mens-couture',
      image: '',
      _count: { products: 9 },
    },
  ];

  const fallbackCoupons = [
    {
      id: 'c1',
      code: 'NAVYA15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderAmount: 2999,
    },
  ];

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
      categories: categories.length > 0 ? categories : fallbackCategories,
      coupons: coupons.length > 0 ? coupons : fallbackCoupons,
    };
  } catch (error) {
    console.error('❌ Failed to fetch marketplace home data:', error);
    return {
      featuredShops: [],
      recentShops: [],
      trendingProducts: [],
      newArrivals: [],
      bestSellers: [],
      categories: fallbackCategories,
      coupons: fallbackCoupons,
    };
  }
});
