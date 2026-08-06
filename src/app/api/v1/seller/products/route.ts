import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';
import { sellerProductSchema } from '@/shared/validations/seller-product.schema';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload.userId as string;
  } catch {
    return null;
  }
}

// GET /api/v1/seller/products - List products for authenticated seller
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found' },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      shopId: shop.id,
      deletedAt: null,
    };

    if (status !== 'ALL') {
      whereCondition.status = status;
    }

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereCondition,
        include: {
          images: {
            select: { id: true, imageUrl: true, isPrimary: true },
            orderBy: { sortOrder: 'asc' },
          },
          variants: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereCondition }),
    ]);

    const counts = {
      ALL: await prisma.product.count({ where: { shopId: shop.id, deletedAt: null } }),
      active: await prisma.product.count({
        where: { shopId: shop.id, status: 'active', deletedAt: null },
      }),
      draft: await prisma.product.count({
        where: { shopId: shop.id, status: 'draft', deletedAt: null },
      }),
      pending_approval: await prisma.product.count({
        where: { shopId: shop.id, status: 'pending_approval', deletedAt: null },
      }),
      archived: await prisma.product.count({
        where: { shopId: shop.id, status: 'archived', deletedAt: null },
      }),
    };

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      counts,
    });
  } catch (error: any) {
    console.error('❌ GET Seller Products Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/v1/seller/products - Create new product for seller shop
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId, deletedAt: null },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validation = sellerProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findFirst({
      where: { sku: data.sku, deletedAt: null },
    });

    if (existingSku) {
      return NextResponse.json(
        { success: false, message: `Product SKU "${data.sku}" is already in use.` },
        { status: 400 },
      );
    }

    // Generate unique slug
    let baseSlug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let uniqueSlug = baseSlug || 'product';
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Atomic transaction for Product, ProductImages, ProductVariants, and AuditLog
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          shopId: shop.id,
          name: data.name,
          slug: uniqueSlug,
          sku: data.sku,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPrice || null,
          stock: data.stock,
          categoryId: data.categoryId,
          status: data.status,
          isFeatured: data.isFeatured,
          gender: data.gender || null,
          fabric: data.fabric || null,
          color: data.color || null,
          fit: data.fit || null,
          occasion: data.occasion || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          metaKeywords: data.metaKeywords || null,
          focusKeyword: data.focusKeyword || null,
        },
      });

      // 2. Create Product Images
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img, index) => ({
            productId: product.id,
            imageUrl: img.imageUrl,
            altText: img.altText || data.name,
            isPrimary: img.isPrimary || index === 0,
            sortOrder: index,
          })),
        });
      }

      // 3. Create Product Variants
      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: product.id,
            name: `${data.name} - ${v.size || ''} ${v.color || ''}`.trim(),
            sku: v.sku,
            barcode: v.barcode || data.barcode || null,
            price: v.price,
            compareAtPrice: v.compareAtPrice || null,
            stock: v.stock,
            availableStock: v.stock,
            size: v.size || null,
            color: v.color || null,
            status: 'active',
          })),
        });
      }

      // 4. Create Audit Log
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'PRODUCT_CREATED',
          entity: 'Product',
          entityId: product.id,
          metadata: {
            name: product.name,
            sku: product.sku,
            price: data.price,
            stock: data.stock,
            status: data.status,
          },
          ipAddress: clientIp,
        },
      });

      return product;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully!',
        data: result,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('❌ POST Create Seller Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
