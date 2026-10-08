import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/backend/lib/api-error-handler';
import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
import { getAdminUser } from '@/backend/lib/session';
import { generateParentSku } from '@/backend/lib/sku-generator';
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

    const categoryFilter = searchParams.get('categoryId') || searchParams.get('category') || 'ALL';

    if (categoryFilter !== 'ALL') {
      whereCondition.OR = [
        { categoryId: categoryFilter },
        { category: { id: categoryFilter } },
        { category: { slug: categoryFilter } },
        { category: { parentId: categoryFilter } },
      ];
    }

    if (query) {
      whereCondition.AND = [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { shop: { name: { contains: query, mode: 'insensitive' } } },
            { category: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    // 1. Compute verified tab counts defensively
    const [totalCount, countAll, countActive, countPending, countDraft, countArchived] =
      await Promise.all([
        prisma.product.count({ where: whereCondition }).catch(() => 0),
        prisma.product.count({ where: { deletedAt: null } }).catch(() => 0),
        prisma.product.count({ where: { status: 'active', deletedAt: null } }).catch(() => 0),
        prisma.product
          .count({ where: { status: { in: ['pending_approval', 'draft'] }, deletedAt: null } })
          .catch(() => 0),
        prisma.product.count({ where: { status: 'draft', deletedAt: null } }).catch(() => 0),
        prisma.product.count({ where: { status: 'archived', deletedAt: null } }).catch(() => 0),
      ]);

    // 2. Fetch products with multi-stage fallback to prevent relation errors
    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
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
      });
    } catch (err: any) {
      console.warn(
        '⚠️ Full product include failed, attempting resilient fallback fetch:',
        err?.message,
      );
      try {
        products = await prisma.product.findMany({
          where: whereCondition,
          include: {
            images: true,
            variants: true,
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
      } catch (fallbackErr: any) {
        console.error(
          '⚠️ Secondary product fetch failed, attempting minimal fetch:',
          fallbackErr?.message,
        );
        products = await prisma.product
          .findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          })
          .catch(() => []);
      }
    }

    const counts = {
      ALL: countAll,
      active: countActive,
      pending_approval: countPending,
      draft: countDraft,
      archived: countArchived,
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
    return handleApiError(error, 'GET Admin Products Error', { isAdmin: true });
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
    const { name, price, stock, categoryName, categoryIds, imageUrl, sku, description } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: 'Product title and price are required.' },
        { status: 400 },
      );
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
    const generatedSku =
      sku && sku.trim().length > 0 ? sku.trim().toUpperCase() : await generateParentSku();

    let validCategoryId: string;
    let metaKeywordsUpdate: string | undefined = undefined;

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const primaryTarget = categoryIds[0];
      validCategoryId = await resolveValidCategoryId(primaryTarget);

      const { getFlattenedCategoryOptions } = await import('@/config/categories.config');
      const allTaxonomy = getFlattenedCategoryOptions();
      const tags = new Set<string>();

      for (const catId of categoryIds) {
        tags.add(catId);
        const found = allTaxonomy.find((t) => t.id === catId || t.slug === catId);
        if (found) {
          tags.add(found.slug);
          tags.add(found.name.toLowerCase());
          if (found.mainGroupName) tags.add(found.mainGroupName.toLowerCase());
        }
      }
      metaKeywordsUpdate = Array.from(tags).join(', ');
    } else {
      validCategoryId = await resolveValidCategoryId(categoryName);
    }

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
        metaKeywords: metaKeywordsUpdate,
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
    return handleApiError(error, 'POST Admin Create Product Error', { isAdmin: true });
  }
}
