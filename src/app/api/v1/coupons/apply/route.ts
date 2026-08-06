import { NextRequest, NextResponse } from 'next/server';

import { applyCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/coupons/apply
 *
 * Applies a coupon code to customer cart and returns calculated discount.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || '';

    const body = await request.json();
    const validationResult = applyCouponSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid coupon payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.applyCoupon(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_APPLY_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
