import { NextResponse } from 'next/server';

/**
 * POST /api/v1/coupons/remove
 *
 * Removes currently applied coupon from cart/checkout.
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Coupon removed successfully.',
    statusCode: 200,
    data: {
      code: null,
      discountAmount: 0,
    },
  });
}
