import { cache } from 'react';

import { prisma } from '@/lib/prisma';

export const getMarketplaceHomeData = cache(async () => {
  const fallbackShops = [
    {
      id: 'shop_navya',
      name: 'Navya Flagship Store',
      slug: 'navya-collection',
      logo: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200',
      banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      rating: 4.9,
      reviewCount: 128,
      verificationBadge: true,
      city: 'Chandigarh',
      state: 'Punjab',
      createdAt: new Date(),
      _count: { products: 45 },
    },
    {
      id: 'shop_fashion_hub',
      name: 'Royal Heritage Sarees',
      slug: 'fashion-hub',
      logo: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=200',
      banner: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
      rating: 4.8,
      reviewCount: 94,
      verificationBadge: true,
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      createdAt: new Date(),
      _count: { products: 32 },
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
        id: 's1',
        name: 'Navya Flagship Store',
        slug: 'navya-collection',
        verificationBadge: true,
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
        id: 's2',
        name: 'Royal Heritage Sarees',
        slug: 'fashion-hub',
        verificationBadge: true,
      },
      category: { id: 'c2', name: 'Bridal Lehengas', slug: 'bridal-lehengas' },
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

      // 3. Trending Products
      prisma.product
        .findMany({
          where: { status: 'active', deletedAt: null },
          take: 8,
          orderBy: { rating: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true, verificationBadge: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 4. New Arrivals Products
      prisma.product
        .findMany({
          where: { status: 'active', deletedAt: null },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 5. Best Sellers Products
      prisma.product
        .findMany({
          where: { status: 'active', deletedAt: null, isFeatured: true },
          take: 8,
          orderBy: { price: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 1 },
            shop: { select: { id: true, name: true, slug: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        })
        .catch(() => []),

      // 6. Active Categories
      prisma.category
        .findMany({
          where: {
            slug: {
              notIn: ['jewellery-accessories', 'kundan-necklaces', 'jhumkas-earrings'],
            },
          },
          take: 8,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            _count: { select: { products: { where: { deletedAt: null, status: 'active' } } } },
          },
        })
        .catch(() => []),

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
      featuredShops: featuredShops.length > 0 ? featuredShops : fallbackShops,
      recentShops: recentShops.length > 0 ? recentShops : fallbackShops,
      trendingProducts: trendingProducts.length > 0 ? trendingProducts : fallbackProducts,
      newArrivals: newArrivals.length > 0 ? newArrivals : fallbackProducts,
      bestSellers: bestSellers.length > 0 ? bestSellers : fallbackProducts,
      categories: categories.length > 0 ? categories : fallbackCategories,
      coupons: coupons.length > 0 ? coupons : fallbackCoupons,
    };
  } catch (error) {
    console.error('❌ Failed to fetch marketplace home data:', error);
    return {
      featuredShops: fallbackShops,
      recentShops: fallbackShops,
      trendingProducts: fallbackProducts,
      newArrivals: fallbackProducts,
      bestSellers: fallbackProducts,
      categories: fallbackCategories,
      coupons: fallbackCoupons,
    };
  }
});
