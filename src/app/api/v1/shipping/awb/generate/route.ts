import { NextRequest, NextResponse } from 'next/server';

import { AwbService } from '@/services/shipping/awb.service';

/**
 * POST /api/v1/shipping/awb/generate
 * Accepts { orderId: string, courierId?: number, maxRetries?: number }
 * Generates and assigns AWB code for the given order shipment with retry handling.
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

    const result = await AwbService.generateAwbForOrder(orderId, {
      courierId: body.courierId ? Number(body.courierId) : undefined,
      maxRetries: body.maxRetries ? Number(body.maxRetries) : undefined,
      retryDelayMs: body.retryDelayMs ? Number(body.retryDelayMs) : undefined,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process AWB generation request.',
        statusCode: 500,
        error: {
          code: 'AWB_GENERATION_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
