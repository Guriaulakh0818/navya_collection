import { NextResponse } from 'next/server';

import { PaymentService } from '@/features/payments/services/payment.service';
import { ensureUserExists } from '@/lib/ensure-user';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/payments/create-order
 *
 * Creates a Razorpay Order with authoritative server-calculated pricing.
 * Auth protected: verifies user session.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'guest_customer_session';
    const validUserId = await ensureUserExists(userId);

    const body = await request.json().catch(() => ({}));
    const { addressId, couponCode, items, shippingMethodCode } = body;

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Please select a delivery address.' },
        { status: 400 },
      );
    }

    const result = await PaymentService.createPaymentOrder(validUserId, {
      addressId,
      couponCode,
      shippingMethodCode,
      items,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    console.error('[CREATE_PAYMENT_ORDER_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error creating payment order.' },
      { status: 500 },
    );
  }
}
