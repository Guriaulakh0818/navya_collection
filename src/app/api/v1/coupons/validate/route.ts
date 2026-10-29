import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

import { validateCouponSchema } from '@/features/coupons/schemas/coupon.schema';
import { CouponService } from '@/features/coupons/services/coupon.service';

/**
 * Fast synchronous user ID extraction from headers / session JWT without slow DB roundtrips.
 */
function getFastUserId(request: NextRequest): string {
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader && userIdHeader.trim()) return userIdHeader.trim();

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  let token =
    authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.substring(7).trim()
      : null;

  if (!token) {
    token =
      request.cookies.get('navya_session')?.value ||
      request.cookies.get('navya_admin_session')?.value ||
      null;
  }

  if (token) {
    try {
      const decoded = jwt.decode(token) as { userId?: string };
      if (decoded && decoded.userId) {
        return decoded.userId;
      }
    } catch {
      // Safe fallback
    }
  }

  return '';
}

/**
 * POST /api/v1/coupons/validate
 *
 * Validates a coupon code against cart total and constraints.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getFastUserId(request);

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
