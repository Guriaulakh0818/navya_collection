import { NextRequest, NextResponse } from 'next/server';

import { PickupService } from '@/services/shipping/pickup.service';

/**
 * GET /api/v1/shipping/pickup/status
 * Fetches pickup status for a given order ID or pickup request ID.
 * Example: /api/v1/shipping/pickup/status?orderId=NC-2026-1001
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId =
      searchParams.get('orderId') ||
      searchParams.get('orderNumber') ||
      searchParams.get('pickupRequestId') ||
      '';

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order ID or Pickup Request ID is required.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await PickupService.getPickupStatus(orderId);

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve pickup status.',
        statusCode: 500,
        error: {
          code: 'PICKUP_STATUS_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
