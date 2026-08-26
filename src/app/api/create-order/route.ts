import { NextResponse } from 'next/server';

import { getRazorpayConfig, getRazorpayInstance } from '@/backend/lib/razorpay';

/**
 * POST /api/create-order
 *
 * Creates a Razorpay Order.
 * Request body: { amount (in paise, min 100), currency?: string, receipt?: string }
 * Response: { success: true, order_id: string, amount: number, currency: string, key_id: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `receipt_${Date.now().toString().slice(-8)}`;

    // Validate minimum amount (100 paise = ₹1)
    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount. Minimum amount must be at least 100 paise (₹1).',
        },
        { status: 400 },
      );
    }

    const config = getRazorpayConfig();
    const razorpay = getRazorpayInstance();

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: body.notes || {},
    });

    return NextResponse.json(
      {
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key_id: config.keyId,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[RAZORPAY_CREATE_ORDER_API_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create Razorpay order.',
      },
      { status: 500 },
    );
  }
}
