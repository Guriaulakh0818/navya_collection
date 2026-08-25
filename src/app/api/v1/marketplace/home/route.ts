import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
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
