import { NextRequest, NextResponse } from 'next/server';

import { validateCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/coupons/validate
 *
 * Validates a coupon code against cart total and constraints.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || '';

    const body = await request.json();
    const validationResult = validateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid coupon validation payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CouponService.validateCoupon(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_VALIDATE_COUPON_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
