import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { createCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/seller/coupons
 * Returns coupons belonging to the authenticated seller's shop with usage & liability metrics.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: currentUser.id, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 403 },
      );
    }

    const response = await CouponService.getSellerCoupons(shop.id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_SELLER_GET_COUPONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/seller/coupons
 * Allows a verified seller to create a SELLER-FUNDED coupon for their shop.
 * Enforces: fundingType must strictly be SELLER; shopId is locked to seller's shop.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: currentUser.id, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Security Rule: Sellers cannot create NAVYA-funded coupons
    if (body.fundingType && body.fundingType.toUpperCase() === 'NAVYA') {
      return NextResponse.json(
        {
          success: false,
          message: 'Sellers can only create SELLER-funded promotional coupons.',
        },
        { status: 403 },
      );
    }

    const inputData = {
      ...body,
      fundingType: 'SELLER' as const,
      shopId: shop.id, // Strictly bind to seller's shop
    };

    const validationResult = createCouponSchema.safeParse(inputData);
    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon input parameters.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.createCoupon(validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_SELLER_CREATE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
