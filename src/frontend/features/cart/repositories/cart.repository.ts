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
              orderBy: { sortOrder: 'asc' as const },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
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
    const { productId, variantId, quantity } = input;
    const cleanVariantId = variantId || null;

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
    guestItems: { productId: string; variantId?: string | null; quantity: number }[],
  ) {
    return await prisma.$transaction(async (tx) => {
      // Clear pre-existing old/seeded cart items to reflect user's current items
      await tx.cartItem.deleteMany({
        where: { cartId },
      });

      for (const guestItem of guestItems) {
        const cleanVariantId = guestItem.variantId || null;

        // Verify Product & Variant validity and stock
        const product = await tx.product.findFirst({
          where: {
            id: guestItem.productId,
            deletedAt: null,
          },
        });

        let availableStock = product?.stock || 50;

        if (cleanVariantId) {
          const variant = await tx.productVariant.findFirst({
            where: {
              id: cleanVariantId,
              deletedAt: null,
            },
          });
          if (variant) {
            availableStock = variant.availableStock || 25;
          }
        }

        const targetQty = Math.min(guestItem.quantity, availableStock);
        if (product) {
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
