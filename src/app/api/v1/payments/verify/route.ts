import { NextResponse } from 'next/server';

import { PaymentService } from '@/features/payments/services/payment.service';
import { ensureUserExists } from '@/lib/ensure-user';
import { getCurrentUser } from '@/lib/session';
import { ShipmentService } from '@/services/shipping/shipment.service';

/**
 * POST /api/v1/payments/verify
 *
 * Verifies Razorpay HMAC SHA256 signature and fulfills the order atomically.
 * Auth protected: verifies user session.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'guest_customer_session';
    const validUserId = await ensureUserExists(userId);

    const body = await request.json().catch(() => ({}));
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, addressId, couponCode } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay signature verification parameters.' },
        { status: 400 },
      );
    }

    const result = await PaymentService.verifyPaymentSignatureAndFulfill(validUserId, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      addressId,
      couponCode,
    });

    if (result.success && result.data?.id) {
      // Trigger Shiprocket shipment creation asynchronously (non-blocking)
      ShipmentService.createShipmentForOrder(result.data.id).catch((shipErr) => {
        console.error('[RAZORPAY_SHIPMENT_TRIGGER_ERROR]', shipErr);
      });
    }

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    console.error('[VERIFY_PAYMENT_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error verifying payment.' },
      { status: 500 },
    );
  }
}
