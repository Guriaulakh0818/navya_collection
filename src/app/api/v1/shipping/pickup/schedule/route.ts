import { NextRequest, NextResponse } from 'next/server';

import { PickupService } from '@/services/shipping/pickup.service';

/**
 * POST /api/v1/shipping/pickup/schedule
 * Accepts { orderId: string, pickupDate?: string, pickupLocation?: string }
 * Schedules courier pickup request for the given order with retries.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId || body.orderNumber;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order ID or Order Number is required.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await PickupService.schedulePickupForOrder(orderId, {
      pickupDate: body.pickupDate,
      pickupLocation: body.pickupLocation,
      maxRetries: body.maxRetries ? Number(body.maxRetries) : undefined,
      retryDelayMs: body.retryDelayMs ? Number(body.retryDelayMs) : undefined,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process pickup scheduling request.',
        statusCode: 500,
        error: {
          code: 'PICKUP_SCHEDULING_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
