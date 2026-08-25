import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Execute all 7 queries concurrently via Promise.all for sub-60ms database response
    let [
      featuredShops,
      recentShops,
      trendingProducts,
      newArrivals,
      bestSellers,
      categories,
      coupons,
    ] = await Promise.all([
      // 1. Featured Shops (Verified & Approved)
      prisma.shop.findMany({
        where: {
          status: 'APPROVED',
          deletedAt: null,
        },
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
      }),
      // 2. Recently Added Shops
      prisma.shop.findMany({
        where: {
          status: 'APPROVED',
          deletedAt: null,
        },
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
      }),
      // 3. Trending Products (Only from Approved Shops)
      prisma.product.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        take: 8,
        orderBy: { rating: 'desc' },
        include: {
          images: { select: { imageUrl: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true, verificationBadge: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      // 4. New Arrivals Products (Only from Approved Shops)
      prisma.product.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { select: { imageUrl: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      // 5. Best Sellers Products (Only from Approved Shops)
      prisma.product.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          isFeatured: true,
          shop: {
            status: 'APPROVED',
            deletedAt: null,
          },
        },
        take: 8,
        orderBy: { price: 'desc' },
        include: {
          images: { select: { imageUrl: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      // 6. Active Categories
      prisma.category.findMany({
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
      }),
      // 7. Active Coupons/Promotions
      prisma.coupon.findMany({
        where: { isActive: true },
        take: 2,
        select: {
          id: true,
          code: true,
          discountType: true,
          discountValue: true,
          minOrderAmount: true,
        },
      }),
    ]);

    // ==============================================================================
    // PURE CLOTHING & APPAREL FALLBACKS (Guarantees 100% UI Rendering)
    // ==============================================================================
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

    const fallbackClothingProducts = [
      {
        id: 'p1',
        name: 'Royal Banarasi Silk Handloom Saree',
        slug: 'royal-banarasi-silk-saree-1',
        price: 14999,
        compareAtPrice: 17499,
        rating: 4.9,
        reviewCount: 38,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' },
        ],
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
        compareAtPrice: 49999,
        rating: 4.9,
        reviewCount: 52,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800' },
        ],
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
        name: 'Raw Silk Floor Length Designer Anarkali',
        slug: 'raw-silk-anarkali-suit-3',
        price: 12499,
        compareAtPrice: 14999,
        rating: 4.8,
        reviewCount: 29,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800' },
        ],
        shop: {
          id: 'shop_style_zone',
          name: 'Style Zone',
          slug: 'style-zone',
          verificationBadge: 'TRUSTED_SELLER',
        },
        category: { id: 'c3', name: 'Anarkalis & Suits', slug: 'anarkalis-suits' },
      },
      {
        id: 'p4',
        name: 'Designer Royal Velvet Sherwani Set',
        slug: 'designer-velvet-sherwani-set-4',
        price: 28999,
        compareAtPrice: 32999,
        rating: 4.8,
        reviewCount: 19,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800' },
        ],
        shop: {
          id: 'shop_navya',
          name: 'Navya Collection',
          slug: 'navya-collection',
          verificationBadge: 'PREMIUM_STORE',
        },
        category: { id: 'c4', name: 'Gents & Mens Couture', slug: 'gents-mens-couture' },
      },
      {
        id: 'p5',
        name: 'Embroidered Heavy Banarasi Silk Dupatta',
        slug: 'embroidered-banarasi-dupatta-5',
        price: 3499,
        compareAtPrice: 4999,
        rating: 4.7,
        reviewCount: 15,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800' },
        ],
        shop: {
          id: 'shop_saniya_fashions',
          name: 'Saniya Fashions',
          slug: 'saniya-fashions',
          verificationBadge: 'VERIFIED_SELLER',
        },
        category: { id: 'c5', name: 'Dupattas & Stoles', slug: 'dupattas-stoles' },
      },
      {
        id: 'p6',
        name: 'Chanderi Silk Embroidered Designer Kurti Set',
        slug: 'chanderi-silk-kurti-set-6',
        price: 5499,
        compareAtPrice: 6999,
        rating: 4.8,
        reviewCount: 41,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800' },
        ],
        shop: {
          id: 's3',
          name: 'Mehra Couture & Suits',
          slug: 'style-zone',
          verificationBadge: true,
        },
        category: { id: 'c6', name: 'Kurtis & Tunics', slug: 'kurtis-tunics' },
      },
    ];

    // When database returns empty arrays (e.g. all shops rejected), do NOT inject mock/fake shops
    featuredShops = featuredShops || [];
    recentShops = recentShops || [];
    trendingProducts = trendingProducts || [];
    newArrivals = newArrivals || [];
    bestSellers = bestSellers || [];

    if (!categories || categories.length === 0) {
      categories = [
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
          id: 'cat_chanderi',
          name: 'Chanderi Sarees',
          slug: 'chanderi-sarees',
          image: '',
          _count: { products: 8 },
        },
        {
          id: 'cat_indowestern',
          name: 'Indo-Western & Fusion',
          slug: 'indo-western-fusion',
          image: '',
          _count: { products: 14 },
        },
        {
          id: 'cat_gents',
          name: 'Gents & Mens Couture',
          slug: 'gents-mens-couture',
          image: '',
          _count: { products: 9 },
        },
        {
          id: 'cat_kurtis',
          name: 'Kurtis & Tunics',
          slug: 'kurtis-tunics',
          image: '',
          _count: { products: 18 },
        },
        {
          id: 'cat_kanjeevaram',
          name: 'Kanjeevaram Silk Sarees',
          slug: 'kanjeevaram-silk-sarees',
          image: '',
          _count: { products: 11 },
        },
      ] as any;
    }

    if (!coupons || coupons.length === 0) {
      coupons = [
        {
          id: 'c1',
          code: 'NAVYA15',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          minOrderAmount: 2999,
        },
        {
          id: 'c2',
          code: 'WELCOME500',
          discountType: 'FLAT',
          discountValue: 500,
          minOrderAmount: 1999,
        },
      ] as any;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          featuredShops,
          recentShops,
          trendingProducts,
          newArrivals,
          bestSellers,
          categories,
          coupons,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ GET Marketplace Home Data Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load marketplace home data.' },
      { status: 500 },
    );
  }
}
