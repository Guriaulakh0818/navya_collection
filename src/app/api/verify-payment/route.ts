import { NextResponse } from 'next/server';

import { verifyRazorpaySignature } from '@/backend/lib/razorpay';

/**
 * POST /api/verify-payment (DEPRECATED & SECURED)
 *
 * Verifies Razorpay Payment Signature using cryptographically safe HMAC-SHA256 comparison.
 * Note: Under BM-06, full order fulfillment and atomic inventory management are handled via
 * POST /api/v1/payments/verify. This endpoint is retained solely for legacy status checks.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const orderId = body.razorpay_order_id || body.razorpayOrderId;
    const paymentId = body.razorpay_payment_id || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.razorpaySignature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required verification parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature.',
        },
        { status: 400 },
      );
    }

    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);

    if (!isValid) {
      console.warn(`[LEGACY_SIGNATURE_MISMATCH] Order ID: ${orderId}, Payment ID: ${paymentId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed: Signature mismatch.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment signature verified. Use /api/v1/payments/verify for order fulfillment.',
        order_id: orderId,
        payment_id: paymentId,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[RAZORPAY_VERIFY_PAYMENT_API_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Server error verifying Razorpay payment signature.',
      },
      { status: 500 },
    );
  }
}
