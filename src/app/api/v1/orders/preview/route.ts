import { NextRequest, NextResponse } from 'next/server';

import { orderPreviewQuerySchema } from '@/features/orders/schemas/order-preview.schema';
import { OrderPreviewService } from '@/features/orders/services/order-preview.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/orders/preview
 *
 * Generates an authoritative server-side order preview.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const { searchParams } = new URL(request.url);
    const queryInput = {
      addressId: searchParams.get('addressId') || undefined,
      couponCode: searchParams.get('couponCode') || undefined,
      shippingMethodCode: searchParams.get('shippingMethodCode') || 'STANDARD',
    };

    const validationResult = orderPreviewQuerySchema.safeParse(queryInput);
    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid order preview query parameters.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await OrderPreviewService.generatePreview(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_ORDER_PREVIEW_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/orders/preview
 *
 * Generates an authoritative server-side order preview from JSON payload.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const body = await request.json().catch(() => ({}));
    const validationResult = orderPreviewQuerySchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid order preview input.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await OrderPreviewService.generatePreview(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_POST_ORDER_PREVIEW_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
