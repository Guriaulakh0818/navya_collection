import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
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

// GET /api/v1/seller/products/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/v1/seller/products/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const existingProduct = await prisma.product.findFirst({
      where: { id, shopId: shop.id, deletedAt: null },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
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

    // Check SKU conflict with other products
    if (data.sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id }, deletedAt: null },
      });
      if (skuCheck) {
        return NextResponse.json(
          { success: false, message: `SKU "${data.sku}" is already assigned to another product.` },
          { status: 400 },
        );
      }
    }

    const validCategoryId = await resolveValidCategoryId(data.categoryId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: data.sku,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPrice || null,
          stock: data.stock,
          categoryId: validCategoryId,
          status: data.status === 'draft' ? 'draft' : 'pending_approval',
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

      // 2. Refresh Product Images
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: data.images.map((img, idx) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || data.name,
            isPrimary: img.isPrimary || idx === 0,
            sortOrder: idx,
          })),
        });
      }

      // 3. Refresh Variants
      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: id,
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

      // 4. Audit Log
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'PRODUCT_UPDATED',
          entity: 'Product',
          entityId: id,
          metadata: { name: data.name, sku: data.sku, price: data.price, stock: data.stock },
          ipAddress: clientIp,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ PUT Seller Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/seller/products/[id] (Soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const product = await prisma.product.findFirst({
      where: { id, shopId: shop.id, deletedAt: null },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete product
      await tx.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit Log
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'PRODUCT_DELETED',
          entity: 'Product',
          entityId: id,
          metadata: { name: product.name, sku: product.sku },
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('❌ DELETE Seller Product Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
