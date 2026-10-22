import { Prisma } from '@prisma/client';

import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';

import { AddToCartInput } from '../schemas/cart.schema';

export class CartRepository {
  /**
   * Includes relation details for Cart calculation (products, images, variants).
   */
  private static cartIncludeQuery = {
    items: {
      include: {
        product: {
          include: {
            images: {
              where: { deletedAt: null },
              orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
        variant: true,
      },
    },
  };

  /**
   * Finds user's active cart by userId, creating one if not exists.
   */
  static async findOrCreateCartByUserId(userId: string) {
    const validUserId = await ensureUserExists(userId);
    let cart = await prisma.cart.findFirst({
      where: {
        OR: [{ userId }, { userId: validUserId }],
      },
      include: this.cartIncludeQuery,
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: validUserId },
        include: this.cartIncludeQuery,
      });
    }

    return cart;
  }

  /**
   * Finds a specific cart item by ID.
   */
  static async findCartItemById(cartItemId: string) {
    return await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Adds an item to user's cart or increments existing quantity.
   */
  static async addOrUpdateItem(cartId: string, input: AddToCartInput) {
    const { productId, variantId, quantity, sku, size, color } = input;
    let cleanVariantId = variantId || null;

    if (cleanVariantId) {
      try {
        const variant = await prisma.productVariant.findFirst({
          where: { id: cleanVariantId, deletedAt: null },
        });
        if (!variant) {
          cleanVariantId = null;
        }
      } catch {
        cleanVariantId = null;
      }
    }

    // Resilient fallback: find variant by SKU or size/color if variantId was missing or outdated
    if (!cleanVariantId && sku) {
      try {
        const variantBySku = await prisma.productVariant.findFirst({
          where: { sku, deletedAt: null },
        });
        if (variantBySku) {
          cleanVariantId = variantBySku.id;
        }
      } catch {}
    }

    if (!cleanVariantId && (size || color)) {
      try {
        const variantByAttrs = await prisma.productVariant.findFirst({
          where: {
            productId,
            deletedAt: null,
            ...(size ? { size } : {}),
            ...(color ? { color } : {}),
          },
        });
        if (variantByAttrs) {
          cleanVariantId = variantByAttrs.id;
        }
      } catch {}
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: cleanVariantId,
      },
    });

    if (existingItem) {
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: true,
          variant: true,
        },
      });
    }

    return await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        variantId: cleanVariantId,
        quantity,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Updates exact quantity for a cart item.
   */
  static async updateItemQuantity(cartItemId: string, quantity: number) {
    return await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Deletes a cart item.
   */
  static async removeItem(cartItemId: string) {
    return await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  /**
   * Clears all items in a cart.
   */
  static async clearCart(cartId: string) {
    return await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  /**
   * Atomically merges guest cart items into a user's database cart using Prisma transactions.
   */
  static async mergeGuestItems(
    cartId: string,
    guestItems: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      sku?: string | null;
      size?: string | null;
      color?: string | null;
    }[],
  ) {
    return await prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        let cleanVariantId = guestItem.variantId || null;

        // Verify Product & Variant validity and stock
        const product = await tx.product.findFirst({
          where: {
            id: guestItem.productId,
            deletedAt: null,
          },
        });

        if (!product) continue;

        let availableStock = product.stock || 50;

        if (cleanVariantId) {
          const variant = await tx.productVariant.findFirst({
            where: {
              id: cleanVariantId,
              deletedAt: null,
            },
          });
          if (variant) {
            availableStock =
              variant.availableStock && variant.availableStock > 0
                ? variant.availableStock
                : variant.stock && variant.stock > 0
                  ? variant.stock
                  : product.stock || 25;
          } else {
            // If variant was deleted or re-created, don't crash foreign key constraint
            cleanVariantId = null;
          }
        }

        // Resilient fallback by SKU or size/color
        if (!cleanVariantId && guestItem.sku) {
          try {
            const vBySku = await tx.productVariant.findFirst({
              where: { sku: guestItem.sku, deletedAt: null },
            });
            if (vBySku) {
              cleanVariantId = vBySku.id;
              availableStock =
                vBySku.availableStock && vBySku.availableStock > 0
                  ? vBySku.availableStock
                  : vBySku.stock && vBySku.stock > 0
                    ? vBySku.stock
                    : product.stock || 25;
            }
          } catch {}
        }

        if (!cleanVariantId && (guestItem.size || guestItem.color)) {
          try {
            const vByAttrs = await tx.productVariant.findFirst({
              where: {
                productId: guestItem.productId,
                deletedAt: null,
                ...(guestItem.size ? { size: guestItem.size } : {}),
                ...(guestItem.color ? { color: guestItem.color } : {}),
              },
            });
            if (vByAttrs) {
              cleanVariantId = vByAttrs.id;
              availableStock =
                vByAttrs.availableStock && vByAttrs.availableStock > 0
                  ? vByAttrs.availableStock
                  : vByAttrs.stock && vByAttrs.stock > 0
                    ? vByAttrs.stock
                    : product.stock || 25;
            }
          } catch {}
        }

        const targetQty = Math.min(guestItem.quantity, availableStock);

        // Check if item already exists in user's cart
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId,
            productId: guestItem.productId,
            variantId: cleanVariantId,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: Math.min(Math.max(existing.quantity, guestItem.quantity), availableStock),
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId,
              productId: guestItem.productId,
              variantId: cleanVariantId,
              quantity: targetQty,
            },
          });
        }
      }

      return tx.cart.findUnique({
        where: { id: cartId },
        include: this.cartIncludeQuery,
      });
    });
  }
}
