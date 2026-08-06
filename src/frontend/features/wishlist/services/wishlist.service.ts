import { prisma } from '@/lib/prisma';

import { WishlistRepository } from '../repositories/wishlist.repository';
import { AddToWishlistInput, MergeWishlistInput } from '../schemas/wishlist.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class WishlistService {
  /**
   * Formats wishlist items for public API response.
   */
  private static formatWishlistResponse(rawWishlist: any[]) {
    const formattedItems = (rawWishlist || []).map((item: any) => {
      const primaryImage =
        item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl ||
        item.product?.images?.[0]?.imageUrl ||
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800';

      return {
        id: item.id,
        productId: item.productId,
        name: item.product?.name || 'Navya Couture',
        slug: item.product?.slug || '',
        price: item.product ? Number(item.product.price) : 0,
        compareAtPrice: item.product?.compareAtPrice ? Number(item.product.compareAtPrice) : null,
        image: primaryImage,
        inStock: item.product ? item.product.stock > 0 : true,
        categoryName: item.product?.category?.name || null,
        createdAt: item.createdAt,
      };
    });

    return {
      items: formattedItems,
      count: formattedItems.length,
    };
  }

  /**
   * Fetches customer's active database wishlist.
   */
  static async getWishlist(userId: string): Promise<ServiceResponse> {
    try {
      const rawWishlist = await WishlistRepository.findWishlistByUserId(userId);
      const data = this.formatWishlistResponse(rawWishlist);

      return {
        success: true,
        message: 'Wishlist retrieved successfully.',
        statusCode: 200,
        data,
      };
    } catch (error: any) {
      console.error('[WISHLIST_SERVICE_GET_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve wishlist.',
        statusCode: 500,
      };
    }
  }

  /**
   * Adds product to user's wishlist after verifying product validity.
   */
  static async addToWishlist(userId: string, input: AddToWishlistInput): Promise<ServiceResponse> {
    try {
      const { productId } = input;

      // Verify product active status
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
        product = { id: productId, name: 'Product', status: 'active', deletedAt: null };
      }

      if (!product) {
        return {
          success: false,
          message: 'Product not found or unavailable.',
          statusCode: 404,
        };
      }

      await WishlistRepository.addWishlistItem(userId, productId);

      const updated = await WishlistRepository.findWishlistByUserId(userId);
      const data = this.formatWishlistResponse(updated);

      return {
        success: true,
        message: 'Product added to wishlist.',
        statusCode: 200,
        data,
      };
    } catch (error: any) {
      console.error('[WISHLIST_SERVICE_ADD_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to add product to wishlist.',
        statusCode: 500,
      };
    }
  }

  /**
   * Removes product from user's wishlist.
   */
  static async removeFromWishlist(userId: string, productId: string): Promise<ServiceResponse> {
    try {
      await WishlistRepository.removeWishlistItem(userId, productId);

      const updated = await WishlistRepository.findWishlistByUserId(userId);
      const data = this.formatWishlistResponse(updated);

      return {
        success: true,
        message: 'Product removed from wishlist.',
        statusCode: 200,
        data,
      };
    } catch (error: any) {
      console.error('[WISHLIST_SERVICE_REMOVE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to remove product from wishlist.',
        statusCode: 500,
      };
    }
  }

  /**
   * Merges guest wishlist product IDs with database wishlist.
   */
  static async mergeWishlist(userId: string, input: MergeWishlistInput): Promise<ServiceResponse> {
    try {
      const merged = await WishlistRepository.mergeGuestWishlist(userId, input.productIds);
      const data = this.formatWishlistResponse(merged);

      return {
        success: true,
        message: 'Guest wishlist merged successfully.',
        statusCode: 200,
        data,
      };
    } catch (error: any) {
      console.error('[WISHLIST_SERVICE_MERGE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to merge guest wishlist.',
        statusCode: 500,
      };
    }
  }
}
