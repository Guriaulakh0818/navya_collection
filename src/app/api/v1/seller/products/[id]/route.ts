import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/backend/lib/api-error-handler';
import { resolveValidCategoryId } from '@/backend/lib/category-resolver';
import { ADMIN_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { generateVariantSku } from '@/backend/lib/sku-generator';
import { NotificationService } from '@/backend/services/notification.service';
import { prisma } from '@/lib/prisma';
import {
  enforceReturnPolicy,
  sellerProductSchema,
} from '@/shared/validations/seller-product.schema';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ||
    cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, mobile: true },
    });

    const isPlatformAdminOrOwner = Boolean(
      user && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase()),
    );

    const product = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isPlatformAdminOrOwner
          ? {}
          : {
              OR: [
                { shop: { ownerId: userId } },
                ...(user?.email ? [{ shop: { email: user.email } }] : []),
                ...(user?.mobile ? [{ shop: { phone: user.mobile } }] : []),
              ],
            }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or unauthorized.' },
        { status: 404 },
      );
    }

    const firstVariant = product.variants?.[0];
    const variantAttrs = (firstVariant?.attributes as any) || {};

    const mappedProduct = {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : 0,
      costPrice: product.costPrice ? Number(product.costPrice) : 0,
      taxRate: product.taxRate ? Number(product.taxRate) : 5,
      taxGstRate: product.taxRate ? Number(product.taxRate) : 5,
      stock: Number(product.stock),
      lowStockThreshold: Number(product.lowStockThreshold || 5),
      productType: variantAttrs.productType || '',
      attributes: variantAttrs,
      pattern: variantAttrs.pattern || '',
      sleeve: variantAttrs.sleeve || '',
      neck: variantAttrs.neck || '',
      weight: firstVariant?.weight || 500,
      barcode: firstVariant?.barcode || '',
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : 0,
        stock: Number(v.stock),
        imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || '',
      })),
    };

    return NextResponse.json({ success: true, data: mappedProduct });
  } catch (error: any) {
    return handleApiError(error, 'GET Seller Product by ID');
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, mobile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User session invalid. Please log in again.' },
        { status: 401 },
      );
    }

    const isPlatformAdminOrOwner = Boolean(
      ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase()),
    );

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isPlatformAdminOrOwner
          ? {}
          : {
              OR: [
                { shop: { ownerId: userId } },
                ...(user?.email ? [{ shop: { email: user.email } }] : []),
                ...(user?.mobile ? [{ shop: { phone: user.mobile } }] : []),
              ],
            }),
      },
      include: {
        shop: {
          include: {
            owner: { select: { name: true, email: true, mobile: true } },
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found or unauthorized.' },
        { status: 404 },
      );
    }

    const shop = existingProduct.shop;
    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Associated seller shop not found.' },
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

    // Check SKU conflict with other products
    // Permanent parent SKU must NOT change on product update
    const parentSku = existingProduct.sku;

    const primaryTargetId =
      Array.isArray(data.categoryIds) && data.categoryIds.length > 0
        ? data.categoryIds[0]
        : data.categoryId;
    const validCategoryId = await resolveValidCategoryId(primaryTargetId);

    // Compute metaKeywords incorporating all assigned category tags
    let metaKeywordsUpdate = data.metaKeywords || '';
    if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
      const catTags = data.categoryIds.map((c) => c.replace(/[^a-zA-Z0-9_-]/g, '')).filter(Boolean);
      const combined = [
        ...catTags,
        ...(data.metaKeywords ? data.metaKeywords.split(',').map((s) => s.trim()) : []),
      ];
      metaKeywordsUpdate = Array.from(new Set(combined)).join(', ');
    }

    const hasVariants = data.variants && data.variants.length > 0;
    const totalStock = hasVariants
      ? data.variants!.reduce((sum, v) => sum + Number(v.stock || 0), 0)
      : Number(data.stock || 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product (keep permanent parent SKU intact)
      const policy = enforceReturnPolicy(data.returnPolicyType);
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          sku: parentSku,
          brand: data.brand || null,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPrice || null,
          stock: totalStock,
          lowStockThreshold: data.lowStockThreshold || 5,
          categoryId: validCategoryId,
          status: data.status === 'draft' ? 'draft' : 'pending_approval',
          isFeatured: data.isFeatured,
          gender: data.gender || null,
          fabric: data.fabric || (data.attributes?.fabric as string) || null,
          color: data.color || null,
          fit: data.fit || (data.attributes?.fit as string) || null,
          occasion: data.occasion || (data.attributes?.occasion as string) || null,
          // Return & Replacement Policy (Section 3)
          returnPolicyType: policy.returnPolicyType,
          returnAllowed: policy.returnAllowed,
          returnWindowDays: policy.returnWindowDays,
          replacementAllowed: policy.replacementAllowed,
          replacementWindowDays: policy.replacementWindowDays,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          metaKeywords: metaKeywordsUpdate || null,
          focusKeyword: data.focusKeyword || null,
        },
      });

      // 2. Refresh Product Images (including variant photos)
      const allImages: any[] = data.images ? [...data.images] : [];
      if (hasVariants && data.variants) {
        data.variants.forEach((v) => {
          const vUrl = v.imageUrl || v.image;
          if (vUrl && !allImages.some((img: any) => img.imageUrl === vUrl)) {
            allImages.push({
              imageUrl: vUrl,
              altText: `${data.name} - ${v.color || 'Variant'}`,
              isPrimary: allImages.length === 0,
              sortOrder: allImages.length,
            });
          }
        });
      }

      if (data.images) {
        const hasExplicitPrimary = allImages.some((img: any) => Boolean(img.isPrimary));
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: allImages.map((img: any, idx: number) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || data.name,
            isPrimary: hasExplicitPrimary ? Boolean(img.isPrimary) : idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }

      // 3. Refresh Variants with Auto-Generated Variant SKUs, Dedicated Image URL & Dynamic Attributes
      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (hasVariants) {
          await tx.productVariant.createMany({
            data: data.variants.map((v, index) => {
              const variantSku =
                v.sku && v.sku.trim().length > 0
                  ? v.sku.trim()
                  : generateVariantSku(parentSku, v.color, v.size, index);

              const primaryProductImg =
                allImages.find((img: any) => img.isPrimary)?.imageUrl ||
                allImages[0]?.imageUrl ||
                null;
              const variantImgUrl = v.imageUrl || v.image || primaryProductImg;
              const attributesPayload = {
                ...(data.attributes || {}),
                ...(typeof v.attributes === 'object' && v.attributes !== null ? v.attributes : {}),
                ...(variantImgUrl ? { imageUrl: variantImgUrl } : {}),
                ...(v.weight ? { weight: v.weight } : {}),
              };

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
                imageUrl: variantImgUrl || null,
                weight: v.weight ? Number(v.weight) : null,
                attributes:
                  Object.keys(attributesPayload).length > 0 ? attributesPayload : undefined,
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

    // Dispatch Admin Notification & Email asynchronously (non-blocking)
    if (result.status === 'pending_approval') {
      prisma.category
        .findUnique({
          where: { id: validCategoryId },
          select: { name: true },
        })
        .then((category) => {
          return NotificationService.notifyAdminNewProductSubmission({
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
        })
        .catch((notifErr) => {
          console.warn('⚠️ Non-critical Admin Product Submission Alert Error:', notifErr);
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ PUT Seller Product Error:', error);
    if (error?.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'field';
      return NextResponse.json(
        {
          success: false,
          message: `Duplicate conflict: A product or variant with this ${target} already exists.`,
        },
        { status: 400 },
      );
    }
    return handleApiError(error, 'PUT Seller Product Error', {
      userMessage: error?.message || 'Server error: please try again after sometime',
    });
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, mobile: true },
    });

    const isPlatformAdminOrOwner = Boolean(
      user && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase()),
    );

    const product = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isPlatformAdminOrOwner
          ? {}
          : {
              OR: [
                { shop: { ownerId: userId } },
                ...(user?.email ? [{ shop: { email: user.email } }] : []),
                ...(user?.mobile ? [{ shop: { phone: user.mobile } }] : []),
              ],
            }),
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or unauthorized.' },
        { status: 404 },
      );
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
    return handleApiError(error, 'DELETE Seller Product Error');
  }
}

// PATCH /api/v1/seller/products/[id] - Quick Stock Adjustment & Replenishment
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, mobile: true },
    });

    const isPlatformAdminOrOwner = Boolean(
      user && ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(String(user.role).toUpperCase()),
    );

    const product = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isPlatformAdminOrOwner
          ? {}
          : {
              OR: [
                { shop: { ownerId: userId } },
                ...(user?.email ? [{ shop: { email: user.email } }] : []),
                ...(user?.mobile ? [{ shop: { phone: user.mobile } }] : []),
              ],
            }),
      },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or unauthorized.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { stockDelta, newStock, variantId, variantStockUpdates } = body;

    let updatedStock = Number(product.stock);
    const updatedVariants: any[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. If variant-level batch updates are provided
      if (Array.isArray(variantStockUpdates) && variantStockUpdates.length > 0) {
        for (const vUp of variantStockUpdates) {
          const variant = product.variants.find((v) => v.id === vUp.variantId);
          if (variant) {
            const vNewStock =
              vUp.newStock !== undefined
                ? Math.max(0, Number(vUp.newStock))
                : Math.max(0, Number(variant.stock) + Number(vUp.stockDelta || 0));
            const updated = await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: vNewStock },
            });
            updatedVariants.push(updated);
          }
        }
        const allDbVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { stock: true },
        });
        updatedStock = allDbVariants.reduce((sum, v) => sum + Number(v.stock), 0);
        await tx.product.update({
          where: { id },
          data: { stock: updatedStock },
        });
      } else if (variantId) {
        // 2. Specific single variant update
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) {
          const vNewStock =
            newStock !== undefined
              ? Math.max(0, Number(newStock))
              : Math.max(0, Number(variant.stock) + Number(stockDelta || 0));
          const updated = await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: vNewStock },
          });
          updatedVariants.push(updated);

          const allDbVariants = await tx.productVariant.findMany({
            where: { productId: id },
            select: { stock: true },
          });
          updatedStock = allDbVariants.reduce((sum, v) => sum + Number(v.stock), 0);
          await tx.product.update({
            where: { id },
            data: { stock: updatedStock },
          });
        }
      } else {
        // 3. Product-level stock update
        const delta = Number(stockDelta || 0);
        updatedStock =
          newStock !== undefined
            ? Math.max(0, Number(newStock))
            : Math.max(0, Number(product.stock) + delta);

        if (product.variants.length > 0) {
          // If variants exist, apply delta to the first variant so variant sum stays synchronized
          const firstVariant = product.variants[0];
          const newVarStock = Math.max(0, Number(firstVariant.stock) + delta);
          await tx.productVariant.update({
            where: { id: firstVariant.id },
            data: { stock: newVarStock },
          });
          const allDbVariants = await tx.productVariant.findMany({
            where: { productId: id },
            select: { stock: true },
          });
          updatedStock = allDbVariants.reduce((sum, v) => sum + Number(v.stock), 0);
        }

        await tx.product.update({
          where: { id },
          data: { stock: updatedStock },
        });
      }

      // Record Audit Log
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'PRODUCT_STOCK_UPDATED',
          entity: 'Product',
          entityId: id,
          metadata: {
            name: product.name,
            sku: product.sku,
            previousStock: product.stock,
            newStock: updatedStock,
            delta: stockDelta,
          },
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Stock updated successfully for "${product.name}". Current stock: ${updatedStock}`,
      data: {
        id: product.id,
        stock: updatedStock,
        variants: updatedVariants,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'PATCH Seller Product Stock Error');
  }
}
