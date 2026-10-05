import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { CouponRepository } from '@/features/coupons/repositories/coupon.repository';
import { updateCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/v1/seller/coupons/[id]
 * Updates/Deactivates a seller's own coupon.
 * Security: Prevents changing fundingType to NAVYA or modifying another seller's coupon.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await CouponRepository.findById(id);

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Coupon not found.' }, { status: 404 });
    }

    // Ownership Verification
    if (existing.shopId !== shop.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden. You cannot modify coupons belonging to another seller or platform.',
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Security: Seller cannot change fundingType to NAVYA or transfer shopId
    if (body.fundingType && body.fundingType.toUpperCase() === 'NAVYA') {
      return NextResponse.json(
        { success: false, message: 'Sellers cannot change coupons to Navya-funded.' },
        { status: 403 },
      );
    }

    const sanitizedData = {
      ...body,
      fundingType: 'SELLER' as const,
      shopId: shop.id,
    };

    const validationResult = updateCouponSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon update payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.updateCoupon(id, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_SELLER_PATCH_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/seller/coupons/[id]
 * Deactivates/Soft deletes a seller's own coupon.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await CouponRepository.findById(id);

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Coupon not found.' }, { status: 404 });
    }

    if (existing.shopId !== shop.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden. You cannot delete coupons belonging to another seller or platform.',
        },
        { status: 403 },
      );
    }

    const response = await CouponService.deleteCoupon(id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_SELLER_DELETE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
