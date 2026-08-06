import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Shop slug is required.' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';

    // 1. Fetch Shop details: Exact slug match first, then ID or name match
    let shop = await prisma.shop.findFirst({
      where: {
        slug: slug.toLowerCase(),
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
        sellerProfile: {
          select: {
            businessName: true,
            legalName: true,
            city: true,
            state: true,
            pincode: true,
            businessAddress: true,
          },
        },
        addresses: true,
      },
    });

    if (!shop) {
      shop = await prisma.shop.findFirst({
        where: {
          OR: [{ id: slug }, { name: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' } }],
          deletedAt: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
            },
          },
          sellerProfile: {
            select: {
              businessName: true,
              legalName: true,
              city: true,
              state: true,
              pincode: true,
              businessAddress: true,
            },
          },
          addresses: true,
        },
      });
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop storefront not found.' },
        { status: 404 },
      );
    }

    // 2. Build product filter conditions - 100% Strict Multi-Tenant Isolation by shopId
    const productWhere: any = {
      shopId: shop.id,
      deletedAt: null,
    };

    if (query) {
      productWhere.AND = [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (category && category !== 'all') {
      productWhere.category = {
        OR: [{ id: category }, { slug: category }],
      };
    }

    // 3. Determine sorting order
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'popular') orderBy = { rating: 'desc' };

    // 4. Fetch Products & Categories for Shop (Strict Isolation)
    const [products, shopCategories, relatedProducts] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        orderBy,
        include: {
          images: { select: { imageUrl: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        where: {
          products: {
            some: {
              shopId: shop.id,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
      prisma.product.findMany({
        where: {
          shopId: shop.id,
          deletedAt: null,
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { select: { imageUrl: true }, take: 1 },
          shop: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          shop,
          products,
          categories: shopCategories,
          relatedProducts,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          Vary: 'Cookie, Host, X-Shop-Slug',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ GET Public Shop Storefront Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load shop storefront.' },
      { status: 500 },
    );
  }
}
