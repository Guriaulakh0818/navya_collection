import { NextRequest, NextResponse } from 'next/server';

import { ReviewService } from '@/backend/services/review.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/reviews
 * Fetch reviews for a product or shop with rating summary breakdown.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const shopId = searchParams.get('shopId') || undefined;

    const summary = await ReviewService.getRatingSummary(productId, shopId);

    const where: any = { deletedAt: null };
    if (productId) where.productId = productId;
    if (shopId) where.shopId = shopId;

    const reviews = productId
      ? await prisma.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        })
      : await prisma.shopReview.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        reviews,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Reviews Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/reviews
 * Submit Product or Shop Review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, shopId, rating, comment } = body;

    if (!userId || (!productId && !shopId) || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: 'Missing required review fields (userId, rating, comment).' },
        { status: 400 },
      );
    }

    const review = await ReviewService.createReview({
      userId,
      productId,
      shopId,
      rating: parseInt(rating, 10),
      comment,
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully.',
      data: review,
    });
  } catch (error: any) {
    console.error('❌ POST Review Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit review.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/reviews
 * Merchant Seller Reply or Admin Review Moderation
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, replyText, isShopReview, status } = body;

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: 'Review ID is required.' },
        { status: 400 },
      );
    }

    if (replyText) {
      const updated = await ReviewService.addSellerReply(reviewId, replyText, isShopReview);
      return NextResponse.json({
        success: true,
        message: 'Seller reply posted successfully.',
        data: updated,
      });
    }

    if (status) {
      const updated = await ReviewService.updateReviewStatus(reviewId, status, isShopReview);
      return NextResponse.json({
        success: true,
        message: `Review status updated to ${status}.`,
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: 'No valid update action provided.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('❌ PATCH Review Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update review.' },
      { status: 500 },
    );
  }
}
