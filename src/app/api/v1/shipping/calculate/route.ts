import { NextRequest, NextResponse } from 'next/server';

import { calculateShippingSchema } from '@/features/shipping/schemas/shipping.schema';
import { ShippingService } from '@/features/shipping/services/shipping.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/shipping/calculate
 *
 * Dynamically calculates shipping charges, free shipping thresholds, and delivery estimates.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || '';

    const body = await request.json();
    const validationResult = calculateShippingSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid shipping calculation input.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await ShippingService.calculateShipping(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_CALCULATE_SHIPPING_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
