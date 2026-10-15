import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/cart/validate
 *
 * Validates a list of cart items against the live database:
 * - Checks if parent product exists, is not soft-deleted, and has status === 'active'.
 * - Checks if selected variant exists, is not soft-deleted, and has status === 'active'.
 * - Checks current real-time stock levels.
 *
 * Returns live availability status, message, and stock for every item.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const items: any[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          hasUnavailableItems: false,
          availableCount: 0,
          unavailableCount: 0,
        },
      });
    }

    const productKeys = items.map((i) => i.productId).filter(Boolean);
    const variantKeys = items.map((i) => i.variantId).filter(Boolean);
    const itemSkus = items.map((i) => i.sku).filter(Boolean);

    // 1. Batch query live products
    let dbProducts: any[] = [];
    try {
      dbProducts = await prisma.product.findMany({
        where: {
          OR: [
            ...(productKeys.length > 0
              ? [{ id: { in: productKeys } }, { slug: { in: productKeys } }, { sku: { in: productKeys } }]
              : []),
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          price: true,
          stock: true,
          status: true,
          deletedAt: true,
          variants: {
            where: { deletedAt: null },
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              price: true,
              stock: true,
              availableStock: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      });
    } catch (err: any) {
      console.error('[CART_VALIDATE_PRODUCTS_ERROR]', err?.message);
    }

    // 2. Batch query live variants if requested by ID or SKU
    let dbVariants: any[] = [];
    try {
      const cleanVariantIds = variantKeys.filter(
        (id: string) => !id.startsWith('dummy_') && !id.startsWith('temp_') && !id.startsWith('cart_'),
      );
      if (cleanVariantIds.length > 0 || itemSkus.length > 0) {
        dbVariants = await prisma.productVariant.findMany({
          where: {
            OR: [
              ...(cleanVariantIds.length > 0 ? [{ id: { in: cleanVariantIds } }] : []),
              ...(itemSkus.length > 0 ? [{ sku: { in: itemSkus } }] : []),
            ],
            deletedAt: null,
          },
          select: {
            id: true,
            productId: true,
            sku: true,
            size: true,
            color: true,
            price: true,
            stock: true,
            availableStock: true,
            status: true,
            deletedAt: true,
          },
        });
      }
    } catch (err: any) {
      console.error('[CART_VALIDATE_VARIANTS_ERROR]', err?.message);
    }

    const productMap = new Map<string, any>();
    const variantMap = new Map<string, any>();

    for (const p of dbProducts) {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
      if (p.sku) productMap.set(p.sku, p);
      if (p.variants) {
        for (const v of p.variants) {
          variantMap.set(v.id, v);
          if (v.sku) variantMap.set(v.sku.toLowerCase(), v);
          if (v.size || v.color) {
            variantMap.set(
              `${p.id}_${(v.size || '').toLowerCase()}_${(v.color || '').toLowerCase()}`,
              v,
            );
          }
        }
      }
    }

    for (const v of dbVariants) {
      variantMap.set(v.id, v);
      if (v.sku) variantMap.set(v.sku.toLowerCase(), v);
      if (v.size || v.color) {
        variantMap.set(
          `${v.productId}_${(v.size || '').toLowerCase()}_${(v.color || '').toLowerCase()}`,
          v,
        );
      }
    }

    // 3. Evaluate availability for each cart item
    let hasUnavailableItems = false;
    let availableCount = 0;
    let unavailableCount = 0;

    const validatedItems = items.map((item) => {
      const dbProduct = productMap.get(item.productId);

      let dbVariant = null;
      if (item.variantId) {
        dbVariant = variantMap.get(item.variantId);
      }
      if (!dbVariant && item.sku) {
        dbVariant = variantMap.get(item.sku.toLowerCase());
      }
      if (!dbVariant && dbProduct && (item.size || item.color)) {
        dbVariant = variantMap.get(
          `${dbProduct.id}_${(item.size || '').toLowerCase()}_${(item.color || '').toLowerCase()}`,
        );
      }

      let isAvailable = true;
      let inStock = true;
      let availableStock = 0;
      let availabilityStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DELETED' | 'INACTIVE' = 'AVAILABLE';
      let availabilityMessage = 'In Stock';

      if (!dbProduct || dbProduct.deletedAt !== null) {
        // Product was deleted from database
        isAvailable = false;
        inStock = false;
        availableStock = 0;
        availabilityStatus = 'DELETED';
        availabilityMessage = 'Currently unavailable';
      } else if (dbProduct.status !== 'active') {
        // Product is inactive / archived
        isAvailable = false;
        inStock = false;
        availableStock = 0;
        availabilityStatus = 'INACTIVE';
        availabilityMessage = 'Currently unavailable';
      } else if (item.variantId && (!dbVariant || dbVariant.deletedAt !== null)) {
        // Variant was deleted from database
        isAvailable = false;
        inStock = false;
        availableStock = 0;
        availabilityStatus = 'DELETED';
        availabilityMessage = 'Currently unavailable';
      } else if (dbVariant && dbVariant.status !== 'active') {
        // Variant is inactive
        isAvailable = false;
        inStock = false;
        availableStock = 0;
        availabilityStatus = 'INACTIVE';
        availabilityMessage = 'Currently unavailable';
      } else {
        // Active item: check physical stock
        availableStock = dbVariant
          ? (dbVariant.availableStock ?? dbVariant.stock ?? 0)
          : (dbProduct.stock ?? 0);

        if (availableStock <= 0) {
          isAvailable = false;
          inStock = false;
          availabilityStatus = 'OUT_OF_STOCK';
          availabilityMessage = 'Currently unavailable';
        } else if (availableStock < item.quantity) {
          isAvailable = true;
          inStock = true;
          availabilityStatus = 'AVAILABLE';
          availabilityMessage = `Only ${availableStock} left in stock`;
        } else {
          isAvailable = true;
          inStock = true;
          availabilityStatus = 'AVAILABLE';
          availabilityMessage = 'In Stock';
        }
      }

      if (isAvailable && inStock) {
        availableCount++;
      } else {
        hasUnavailableItems = true;
        unavailableCount++;
      }

      return {
        id: item.id || item.productId,
        productId: item.productId,
        variantId: item.variantId || null,
        isAvailable,
        inStock,
        availableStock,
        availabilityStatus,
        availabilityMessage,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: validatedItems,
        hasUnavailableItems,
        availableCount,
        unavailableCount,
      },
    });
  } catch (error: any) {
    console.error('[API_CART_VALIDATE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate cart items.' },
      { status: 500 },
    );
  }
}
