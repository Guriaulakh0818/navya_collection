import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const revalidate = 120; // 2 minutes Edge CDN cache

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
            images: {
              select: { imageUrl: true },
              take: 2,
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            },
            shop: {
              select: { id: true, name: true, slug: true, city: true, verificationBadge: true },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    parentId: true,
                    parent: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),

        // 3. Fetch ALL Active Categories
        prisma.category.findMany({
          where: { deletedAt: null, status: 'active' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        }),
      ]);
    } catch (dbErr) {
      console.warn('⚠️ DB query error in catalog route:', dbErr);
    }

    const finalShops = dbShops;
    const finalProducts = dbProducts.map((p) => {
      let g = p.gender;
      if (!g) {
        const catSlug = p.category?.slug || '';
        const parentSlug = p.category?.parent?.slug || '';
        const grandParentSlug = p.category?.parent?.parent?.slug || '';
        const pName = (p.name || '').toLowerCase();

        if (
          catSlug.startsWith('men-') ||
          parentSlug === 'men' ||
          grandParentSlug === 'men' ||
          p.category?.parentId === 'group_men' ||
          pName.includes('men’s') ||
          pName.includes("men's") ||
          pName.includes('gents')
        ) {
          g = 'men';
        } else if (
          catSlug.startsWith('kids-') ||
          catSlug.startsWith('baby-') ||
          catSlug.startsWith('boys-') ||
          catSlug.startsWith('girls-') ||
          parentSlug === 'kids' ||
          grandParentSlug === 'kids' ||
          p.category?.parentId === 'group_kids' ||
          pName.includes('baby') ||
          pName.includes('boy') ||
          pName.includes('girl') ||
          pName.includes('kid')
        ) {
          g = 'kids';
        } else if (
          catSlug.startsWith('women-') ||
          parentSlug === 'women' ||
          grandParentSlug === 'women' ||
          p.category?.parentId === 'group_women' ||
          pName.includes('women') ||
          pName.includes('saree') ||
          pName.includes('lehenga') ||
          pName.includes('kurti')
        ) {
          g = 'women';
        }
      }
      return {
        ...p,
        gender: g || p.gender,
      };
    });

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
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
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
