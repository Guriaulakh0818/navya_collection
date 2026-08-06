import { NextRequest, NextResponse } from 'next/server';

import { updateCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';

/**
 * PUT /api/v1/admin/coupons/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const validationResult = updateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon update payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.updateCoupon(params.id, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_UPDATE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/admin/coupons/[id]
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await CouponService.deleteCoupon(params.id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_DELETE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
