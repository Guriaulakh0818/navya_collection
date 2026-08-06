import { NextRequest, NextResponse } from 'next/server';

import { createCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';

/**
 * GET /api/v1/admin/coupons
 *
 * Retrieves all coupons for Admin management.
 */
export async function GET() {
  try {
    const response = await CouponService.getAdminCoupons();
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_GET_COUPONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/admin/coupons
 *
 * Creates a new coupon.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createCouponSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon input parameters.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.createCoupon(validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADMIN_CREATE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
