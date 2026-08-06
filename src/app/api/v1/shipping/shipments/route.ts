import { NextRequest, NextResponse } from 'next/server';

import { ShipmentService } from '@/services/shipping/shipment.service';

/**
 * POST /api/v1/shipping/shipments
 * Accepts { orderId: string, weight?: number, length?: number, breadth?: number, height?: number }
 * Creates shipment on Shiprocket for the given order and persists metadata in database.
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

    const result = await ShipmentService.createShipmentForOrder(orderId, {
      weight: body.weight ? Number(body.weight) : undefined,
      length: body.length ? Number(body.length) : undefined,
      breadth: body.breadth ? Number(body.breadth) : undefined,
      height: body.height ? Number(body.height) : undefined,
      pickupLocation: body.pickupLocation,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process shipment creation.',
        statusCode: 500,
        error: {
          code: 'SHIPMENT_CREATION_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
