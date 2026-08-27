import { NextRequest, NextResponse } from 'next/server';

import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/products - List all products in catalog for Admin
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null,
    };

    if (status !== 'ALL') {
      whereCondition.status = status;
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereCondition }),
    ]);

    const counts = {
      ALL: await prisma.product.count({ where: { deletedAt: null } }),
      active: await prisma.product.count({ where: { status: 'active', deletedAt: null } }),
      pending_approval: await prisma.product.count({
        where: { status: 'pending_approval', deletedAt: null },
      }),
      draft: await prisma.product.count({ where: { status: 'draft', deletedAt: null } }),
      archived: await prisma.product.count({ where: { status: 'archived', deletedAt: null } }),
    };

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
      },
      counts,
    });
  } catch (error: any) {
    console.error('❌ GET Admin Products Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/v1/admin/products - Create new product by Admin
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, price, stock, categoryName, imageUrl, sku, description } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: 'Product title and price are required.' },
        { status: 400 },
      );
    }

    // Ensure or find category
    let category = await prisma.category.findFirst({
      where: { name: { contains: categoryName || 'Gents Collection', mode: 'insensitive' } },
    });

    if (!category) {
      category = await prisma.category.findFirst({
        where: { slug: 'sarees' },
      });
    }

    // Default shop
    const shop = await prisma.shop.findFirst({
      where: { status: 'APPROVED', deletedAt: null },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No active approved shop found to attach product.' },
        { status: 400 },
      );
    }

    const generatedSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const generatedSku = sku || `NC-ADM-${Math.floor(1000 + Math.random() * 9000)}`;

    const validCategoryId = await resolveValidCategoryId(category?.id || categoryName);

    const newProduct = await prisma.product.create({
      data: {
        shopId: shop.id,
        categoryId: validCategoryId,
        name: name.trim(),
        slug: generatedSlug,
        sku: generatedSku.toUpperCase(),
        description: description || 'Premium product catalog entry.',
        price: Number(price),
        stock: Number(stock) || 10,
        status: 'active',
        images: imageUrl
          ? {
              create: [
                {
                  imageUrl: imageUrl.trim(),
                  altText: name.trim(),
                  isPrimary: true,
                  sortOrder: 1,
                },
              ],
            }
          : undefined,
      },
      include: {
        images: true,
        category: true,
        shop: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product created and published to catalog!',
      data: newProduct,
    });
  } catch (error: any) {
    console.error('❌ POST Admin Create Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
