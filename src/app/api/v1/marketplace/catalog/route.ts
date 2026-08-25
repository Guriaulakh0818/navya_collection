import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let dbShops: any[] = [];
    let dbProducts: any[] = [];
    let dbCategories: any[] = [];

    try {
      [dbShops, dbProducts, dbCategories] = await Promise.all([
        // 1. Fetch ALL APPROVED non-deleted shops across the entire marketplace
        prisma.shop.findMany({
          where: {
            status: 'APPROVED',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ownerId: true,
            name: true,
            slug: true,
            logo: true,
            banner: true,
            rating: true,
            reviewCount: true,
            verificationBadge: true,
            city: true,
            state: true,
            status: true,
            createdAt: true,
            _count: {
              select: { products: { where: { deletedAt: null, status: 'active' } } },
            },
          },
        }),

        // 2. Fetch ALL active products belonging ONLY to APPROVED shops
        prisma.product.findMany({
          where: {
            status: 'active',
            deletedAt: null,
            shop: {
              status: 'APPROVED',
              deletedAt: null,
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            images: { select: { imageUrl: true }, take: 2 },
            shop: {
              select: { id: true, name: true, slug: true, city: true, verificationBadge: true },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
        }),

        // 3. Fetch ALL Categories
        prisma.category.findMany({
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
      ]);
    } catch (dbErr) {
      console.warn('⚠️ DB query error in catalog route:', dbErr);
    }

    const finalShops = dbShops;
    const finalProducts = dbProducts;

    return NextResponse.json(
      {
        success: true,
        data: {
          shops: finalShops,
          products: finalProducts,
          categories: dbCategories,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ GET Marketplace Catalog Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch catalog.' },
      { status: 500 },
    );
  }
}
