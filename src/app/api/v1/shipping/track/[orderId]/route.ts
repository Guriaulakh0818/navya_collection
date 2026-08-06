import { NextRequest, NextResponse } from 'next/server';

import { TrackingService } from '@/services/shipping/tracking.service';

/**
 * GET /api/v1/shipping/track/[orderId]
 * Fetches shipment tracking status, order timeline, and syncs status in PostgreSQL DB.
 * Query Params: ?refresh=true to bypass cache
 */
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order ID or AWB code is required.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await TrackingService.trackShipment(orderId, {
      skipCache: refresh,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process shipment tracking request.',
        statusCode: 500,
        error: {
          code: 'TRACKING_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
