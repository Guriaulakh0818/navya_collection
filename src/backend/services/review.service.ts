import { prisma } from '@/lib/prisma';

export interface CreateReviewOptions {
  userId: string;
  productId?: string;
  shopId?: string;
  rating: number;
  comment: string;
}

export class ReviewService {
  /**
   * Verify if user has purchased the item or placed an order at the boutique shop.
   */
  static async isVerifiedPurchase(
    userId: string,
    productId?: string,
    shopId?: string,
  ): Promise<boolean> {
    try {
      if (productId) {
        const orderItem = await prisma.orderItem.findFirst({
          where: {
            productId,
            order: { userId, paymentStatus: 'PAID' },
          },
        });
        if (orderItem) return true;
      }

      if (shopId) {
        const vendorOrder = await prisma.vendorOrder.findFirst({
          where: {
            shopId,
            masterOrder: { userId, paymentStatus: 'PAID' },
          },
        });
        if (vendorOrder) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Calculate Rating Summary Breakdown (Average Rating + 5-star to 1-star percentage counts).
   */
  static async getRatingSummary(productId?: string, shopId?: string) {
    const where: any = { deletedAt: null, status: 'APPROVED' };
    if (productId) where.productId = productId;
    if (shopId) where.shopId = shopId;

    const reviews = productId
      ? await prisma.review.findMany({ where })
      : await prisma.shopReview.findMany({ where });

    const totalCount = reviews.length;
    if (totalCount === 0) {
      return {
        averageRating: 0,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = parseFloat((sum / totalCount).toFixed(1));

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
    });

    const percentages = {
      5: Math.round((distribution[5] / totalCount) * 100),
      4: Math.round((distribution[4] / totalCount) * 100),
      3: Math.round((distribution[3] / totalCount) * 100),
      2: Math.round((distribution[2] / totalCount) * 100),
      1: Math.round((distribution[1] / totalCount) * 100),
    };

    return {
      averageRating,
      totalCount,
      distribution,
      percentages,
    };
  }

  /**
   * Submit Product or Shop Review
   */
  static async createReview(options: CreateReviewOptions) {
    const { userId, productId, shopId, rating, comment } = options;

    if (!comment || comment.trim().length < 3) {
      throw new Error('Please write a constructive comment for your review.');
    }

    const isVerified = await this.isVerifiedPurchase(userId, productId, shopId);

    if (productId) {
      const review = await prisma.review.upsert({
        where: { userId_productId: { userId, productId } },
        update: {
          rating,
          comment,
          isVerifiedPurchase: isVerified,
          status: 'APPROVED',
        },
        create: {
          userId,
          productId,
          rating,
          comment,
          isVerifiedPurchase: isVerified,
          status: 'APPROVED',
        },
      });

      // Update product average rating
      const summary = await this.getRatingSummary(productId, undefined);
      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: summary.averageRating,
          reviewCount: summary.totalCount,
        },
      });

      return review;
    }

    if (shopId) {
      const shopReview = await prisma.shopReview.upsert({
        where: { userId_shopId: { userId, shopId } },
        update: {
          rating,
          comment,
          isVerifiedPurchase: isVerified,
          status: 'APPROVED',
        },
        create: {
          userId,
          shopId,
          rating,
          comment,
          isVerifiedPurchase: isVerified,
          status: 'APPROVED',
        },
      });

      // Update shop average rating
      const summary = await this.getRatingSummary(undefined, shopId);
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          rating: summary.averageRating,
          reviewCount: summary.totalCount,
        },
      });

      return shopReview;
    }

    throw new Error('Product ID or Shop ID is required to post a review.');
  }

  /**
   * Seller Reply to Customer Review
   */
  static async addSellerReply(reviewId: string, replyText: string, isShopReview = false) {
    if (!replyText || replyText.trim().length === 0) {
      throw new Error('Reply text cannot be empty.');
    }

    if (isShopReview) {
      return await prisma.shopReview.update({
        where: { id: reviewId },
        data: {
          sellerReply: replyText.trim(),
          sellerRepliedAt: new Date(),
        },
      });
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: replyText.trim(),
        sellerRepliedAt: new Date(),
      },
    });
  }

  /**
   * Admin Review Moderation
   */
  static async updateReviewStatus(reviewId: string, status: string, isShopReview = false) {
    if (isShopReview) {
      return await prisma.shopReview.update({
        where: { id: reviewId },
        data: { status },
      });
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });
  }
}
