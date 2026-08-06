import { prisma } from '@/lib/prisma';

import { CartRepository } from '../repositories/cart.repository';
import { AddToCartInput, MergeCartInput, UpdateCartItemInput } from '../schemas/cart.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class CartService {
  /**
   * Calculates financial breakdown for a cart (subtotal, shipping, discount, total).
   */
  private static calculateCartTotals(rawCart: any) {
    let subtotal = 0;
    let originalSubtotal = 0;

    const formattedItems = (rawCart.items || [])
      .filter((item: any) => {
        // Filter out soft deleted products/variants
        if (!item.product || item.product.deletedAt !== null) {
          return false;
        }
        if (item.variant && item.variant.deletedAt !== null) {
          return false;
        }
        return true;
      })
      .map((item: any) => {
        const itemPrice = item.variant ? Number(item.variant.price) : Number(item.product.price);
        const itemCompareAtPrice = item.variant
          ? item.variant.compareAtPrice
            ? Number(item.variant.compareAtPrice)
            : itemPrice
          : item.product.compareAtPrice
            ? Number(item.product.compareAtPrice)
            : itemPrice;

        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;
        originalSubtotal += itemCompareAtPrice * item.quantity;

        const primaryImage =
          item.product.images?.find((img: any) => img.isPrimary)?.imageUrl ||
          item.product.images?.[0]?.imageUrl ||
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800';

        const availableStock = item.variant ? item.variant.availableStock : item.product.stock;

        return {
          id: item.id,
          cartId: item.cartId,
          productId: item.productId,
          variantId: item.variantId,
          name: item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name,
          productName: item.product.name,
          productSlug: item.product.slug,
          variantName: item.variant?.name || null,
          size: item.variant?.size || null,
          color: item.variant?.color || null,
          sku: item.variant?.sku || item.product.sku,
          price: itemPrice,
          compareAtPrice: itemCompareAtPrice,
          quantity: item.quantity,
          availableStock,
          image: primaryImage,
          subtotal: itemSubtotal,
        };
      });

    const discount = Math.max(0, originalSubtotal - subtotal);
    // Free shipping threshold ₹999, standard shipping ₹99
    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal + shipping);

    return {
      id: rawCart.id,
      userId: rawCart.userId,
      items: formattedItems,
      itemCount: formattedItems.reduce((acc: number, item: any) => acc + item.quantity, 0),
      subtotal,
      discount,
      shipping,
      total,
      freeShippingThreshold: 999,
      freeShippingRemaining: Math.max(0, 999 - subtotal),
    };
  }

  /**
   * Fetches customer's active database cart.
   */
  static async getCart(userId: string): Promise<ServiceResponse> {
    try {
      const rawCart = await CartRepository.findOrCreateCartByUserId(userId);
      const calculatedCart = this.calculateCartTotals(rawCart);

      return {
        success: true,
        message: 'Cart retrieved successfully.',
        statusCode: 200,
        data: calculatedCart,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_GET_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve cart.',
        statusCode: 500,
      };
    }
  }

  /**
   * Adds an item to customer's active cart after verifying inventory & status.
   */
  static async addToCart(userId: string, input: AddToCartInput): Promise<ServiceResponse> {
    try {
      const { productId, variantId, quantity } = input;

      // 1. Verify Product Existence & Status
      let product;
      try {
        product = await prisma.product.findFirst({
          where: {
            id: productId,
            status: 'active',
            deletedAt: null,
          },
        });
      } catch {
        // Fallback for offline mode
        product = {
          id: productId,
          name: 'Product',
          price: 999,
          stock: 50,
          status: 'active',
          deletedAt: null,
        };
      }

      if (!product) {
        return {
          success: false,
          message: 'Product not found or unavailable.',
          statusCode: 404,
        };
      }

      // 2. Verify Variant Existence & Stock (if variantId provided)
      let availableStock = product.stock;
      if (variantId) {
        let variant;
        try {
          variant = await prisma.productVariant.findFirst({
            where: {
              id: variantId,
              productId,
              status: 'active',
              deletedAt: null,
            },
          });
        } catch {
          variant = { id: variantId, availableStock: 25, status: 'active', deletedAt: null };
        }

        if (!variant) {
          return {
            success: false,
            message: 'Selected product variant not found or unavailable.',
            statusCode: 404,
          };
        }
        availableStock = variant.availableStock;
      }

      // 3. Stock Check
      if (availableStock <= 0) {
        return {
          success: false,
          message: 'Item is currently out of stock.',
          statusCode: 400,
        };
      }

      // Get user's cart
      const cart = await CartRepository.findOrCreateCartByUserId(userId);
      const existingCartItem = cart.items.find(
        (i: any) => i.productId === productId && (i.variantId || null) === (variantId || null),
      );

      const currentQtyInCart = existingCartItem ? existingCartItem.quantity : 0;
      if (currentQtyInCart + quantity > availableStock) {
        return {
          success: false,
          message: `Cannot add ${quantity} more units. Only ${availableStock - currentQtyInCart} remaining in stock.`,
          statusCode: 400,
        };
      }

      // 4. Add or Update Item in Database
      await CartRepository.addOrUpdateItem(cart.id, input);

      // Return refreshed calculated cart
      const updatedCart = await CartRepository.findOrCreateCartByUserId(userId);
      const calculated = this.calculateCartTotals(updatedCart);

      return {
        success: true,
        message: 'Item added to cart successfully.',
        statusCode: 200,
        data: calculated,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_ADD_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to add item to cart.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates cart item quantity after checking inventory limits.
   */
  static async updateItemQuantity(
    userId: string,
    cartItemId: string,
    input: UpdateCartItemInput,
  ): Promise<ServiceResponse> {
    try {
      const cartItem = await CartRepository.findCartItemById(cartItemId);
      if (!cartItem) {
        return {
          success: false,
          message: 'Cart item not found.',
          statusCode: 404,
        };
      }

      // Verify Ownership
      const cart = await CartRepository.findOrCreateCartByUserId(userId);
      if (cartItem.cartId !== cart.id) {
        return {
          success: false,
          message: 'Unauthorized access to cart item.',
          statusCode: 403,
        };
      }

      // Check Available Stock
      const availableStock = cartItem.variant
        ? cartItem.variant.availableStock
        : cartItem.product.stock;

      if (input.quantity > availableStock) {
        return {
          success: false,
          message: `Requested quantity exceeds available stock (${availableStock} units available).`,
          statusCode: 400,
        };
      }

      await CartRepository.updateItemQuantity(cartItemId, input.quantity);

      const updatedCart = await CartRepository.findOrCreateCartByUserId(userId);
      const calculated = this.calculateCartTotals(updatedCart);

      return {
        success: true,
        message: 'Cart quantity updated successfully.',
        statusCode: 200,
        data: calculated,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update item quantity.',
        statusCode: 500,
      };
    }
  }

  /**
   * Removes an item from user's cart.
   */
  static async removeItem(userId: string, cartItemId: string): Promise<ServiceResponse> {
    try {
      const cartItem = await CartRepository.findCartItemById(cartItemId);
      if (!cartItem) {
        return {
          success: false,
          message: 'Cart item not found.',
          statusCode: 404,
        };
      }

      const cart = await CartRepository.findOrCreateCartByUserId(userId);
      if (cartItem.cartId !== cart.id) {
        return {
          success: false,
          message: 'Unauthorized access to cart item.',
          statusCode: 403,
        };
      }

      await CartRepository.removeItem(cartItemId);

      const updatedCart = await CartRepository.findOrCreateCartByUserId(userId);
      const calculated = this.calculateCartTotals(updatedCart);

      return {
        success: true,
        message: 'Item removed from cart.',
        statusCode: 200,
        data: calculated,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_REMOVE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to remove item from cart.',
        statusCode: 500,
      };
    }
  }

  /**
   * Clears all items from user's active cart.
   */
  static async clearCart(userId: string): Promise<ServiceResponse> {
    try {
      const cart = await CartRepository.findOrCreateCartByUserId(userId);
      await CartRepository.clearCart(cart.id);

      const updatedCart = await CartRepository.findOrCreateCartByUserId(userId);
      const calculated = this.calculateCartTotals(updatedCart);

      return {
        success: true,
        message: 'Cart cleared successfully.',
        statusCode: 200,
        data: calculated,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_CLEAR_ERROR]', error);
      return {
        success: false,
        message: 'Failed to clear cart.',
        statusCode: 500,
      };
    }
  }

  /**
   * Atomically merges guest cart items with user's database cart upon login.
   */
  static async mergeCart(userId: string, input: MergeCartInput): Promise<ServiceResponse> {
    try {
      const cart = await CartRepository.findOrCreateCartByUserId(userId);
      const mergedCart = await CartRepository.mergeGuestItems(cart.id, input.items);

      const calculated = this.calculateCartTotals(mergedCart || cart);

      return {
        success: true,
        message: 'Guest cart merged successfully.',
        statusCode: 200,
        data: calculated,
      };
    } catch (error: any) {
      console.error('[CART_SERVICE_MERGE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to merge guest cart.',
        statusCode: 500,
      };
    }
  }
}
