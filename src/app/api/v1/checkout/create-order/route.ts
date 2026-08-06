import { NextRequest, NextResponse } from 'next/server';

import { OrderSplitService } from '@/backend/services/order-split.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      discountAmount,
      notes,
      items,
    } = body;

    if (!userId || !addressId || !paymentMethod || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required checkout fields (userId, addressId, paymentMethod, items).',
        },
        { status: 400 },
      );
    }

    const result = await OrderSplitService.createSplitOrder({
      userId,
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      discountAmount,
      notes,
      items,
    });

    return NextResponse.json({
      success: true,
      message: 'Master Order and Child Vendor Orders created successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ POST Checkout Create Order Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Checkout order split execution failed.' },
      { status: 500 },
    );
  }
}
