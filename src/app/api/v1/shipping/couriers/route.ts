import { NextRequest, NextResponse } from 'next/server';

import { CourierService } from '@/services/shipping/courier.service';

/**
 * GET /api/v1/shipping/couriers
 * Fetches available couriers for pincode and weight, returning cheapest recommendation & options.
 * Example: /api/v1/shipping/couriers?deliveryPincode=110001&weight=0.5&isCod=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const deliveryPincode =
      searchParams.get('deliveryPincode') || searchParams.get('pincode') || '';
    const pickupPincode = searchParams.get('pickupPincode') || undefined;
    const weight = searchParams.get('weight') ? Number(searchParams.get('weight')) : undefined;
    const isCod = searchParams.get('isCod') === 'true' || searchParams.get('cod') === '1';
    const selectedCourierId = searchParams.get('selectedCourierId')
      ? Number(searchParams.get('selectedCourierId'))
      : undefined;

    if (!deliveryPincode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Delivery pincode is required.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await CourierService.getCourierRecommendations({
      deliveryPincode,
      pickupPincode,
      weight,
      isCod,
      selectedCourierId,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve courier recommendations.',
        statusCode: 500,
        error: {
          code: 'COURIER_RECOMMENDATION_API_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/shipping/couriers
 * Accepts JSON body for serviceability query & admin courier override.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const deliveryPincode = body.deliveryPincode || body.pincode || '';

    if (!deliveryPincode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Delivery pincode is required in body.',
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const result = await CourierService.getCourierRecommendations({
      deliveryPincode,
      pickupPincode: body.pickupPincode,
      weight: body.weight ? Number(body.weight) : undefined,
      isCod: Boolean(body.isCod || body.cod),
      orderId: body.orderId,
      selectedCourierId: body.selectedCourierId ? Number(body.selectedCourierId) : undefined,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process courier recommendation request.',
        statusCode: 500,
        error: {
          code: 'COURIER_RECOMMENDATION_POST_ERROR',
          details: error.message,
        },
      },
      { status: 500 },
    );
  }
}
