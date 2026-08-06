import { NextRequest, NextResponse } from 'next/server';

import { createAddressSchema } from '@/features/addresses/schemas/address.schema';
import { AddressService } from '@/features/addresses/services/address.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/addresses
 *
 * Retrieves all saved addresses for the authenticated customer.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const response = await AddressService.getAddresses(userId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_ADDRESSES_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/addresses
 *
 * Adds a new address for the authenticated or guest customer.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const body = await request.json();
    const validationResult = createAddressSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid address input.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await AddressService.createAddress(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_CREATE_ADDRESS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
