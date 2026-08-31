import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { generateVariantSku } from '@/backend/lib/sku-generator';
import { NotificationService } from '@/backend/services/notification.service';
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
      include: {
        owner: { select: { name: true, email: true, mobile: true } },
      },
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
    // Permanent parent SKU must NOT change on product update
    const parentSku = existingProduct.sku;

    const validCategoryId = await resolveValidCategoryId(data.categoryId);

    const hasVariants = data.variants && data.variants.length > 0;
    const totalStock = hasVariants
      ? data.variants!.reduce((sum, v) => sum + Number(v.stock || 0), 0)
      : Number(data.stock || 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product (keep permanent parent SKU intact)
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: parentSku,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPrice || null,
          stock: totalStock,
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

      // 3. Refresh Variants with Auto-Generated Variant SKUs
      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (hasVariants) {
          await tx.productVariant.createMany({
            data: data.variants.map((v, index) => {
              const variantSku =
                v.sku && v.sku.trim().length > 0
                  ? v.sku.trim()
                  : generateVariantSku(parentSku, v.color, v.size, index);

              return {
                productId: id,
                name: `${data.name} - ${v.color || ''} ${v.size || ''}`.trim(),
                sku: variantSku,
                barcode: v.barcode || data.barcode || null,
                price: v.price,
                compareAtPrice: v.compareAtPrice || null,
                stock: Number(v.stock || 0),
                availableStock: Number(v.stock || 0),
                size: v.size || null,
                color: v.color || null,
                status: 'active',
              };
            }),
          });
        }
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

    // Dispatch Admin Notification & Email if product is pending approval
    if (result.status === 'pending_approval') {
      try {
        const category = await prisma.category.findUnique({
          where: { id: validCategoryId },
          select: { name: true },
        });

        await NotificationService.notifyAdminNewProductSubmission({
          productId: result.id,
          productName: result.name,
          sku: result.sku,
          price: Number(result.price),
          stock: Number(result.stock),
          categoryName: category?.name,
          shopName: shop.name,
          sellerName: shop.owner?.name || shop.name,
          sellerEmail: shop.owner?.email || shop.email || '',
          sellerMobile: shop.owner?.mobile || shop.phone || '',
          imageUrl: data.images?.[0]?.imageUrl,
        });
      } catch (notifErr) {
        console.warn('⚠️ Non-critical Admin Product Submission Email Alert Error:', notifErr);
      }
    }

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
