import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Execute all 7 queries concurrently via Promise.all for sub-60ms database response
    const [
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
          status: 'active',
          deletedAt: null,
          slug: {
            notIn: ['jewellery-accessories', 'kundan-necklaces', 'jhumkas-earrings'],
          },
        },
        take: 8,
        orderBy: { displayOrder: 'asc' },
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
        where: { isActive: true, deletedAt: null },
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
