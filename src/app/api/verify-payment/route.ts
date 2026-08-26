import { NextResponse } from 'next/server';

import { verifyRazorpaySignature } from '@/backend/lib/razorpay';

/**
 * POST /api/verify-payment
 *
 * Verifies Razorpay Payment Signature using HMAC-SHA256 algorithm.
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) === razorpay_signature
 * Request body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Accept both snake_case and camelCase parameters
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
      console.warn(`[SIGNATURE_MISMATCH] Order ID: ${orderId}, Payment ID: ${paymentId}`);
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
        message: 'Payment verified successfully!',
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
