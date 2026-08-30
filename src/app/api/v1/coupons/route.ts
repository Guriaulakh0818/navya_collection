import { NextResponse } from 'next/server';

import { CouponService } from '@/features/coupons/services/coupon.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/coupons
 * Returns active public coupons for customer checkout & promo code picker
 */
export async function GET() {
  try {
    const response = await CouponService.getActiveCoupons();
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_ACTIVE_COUPONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
