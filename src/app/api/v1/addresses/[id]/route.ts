import { NextRequest, NextResponse } from 'next/server';

import { updateAddressSchema } from '@/features/addresses/schemas/address.schema';
import { AddressService } from '@/features/addresses/services/address.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/addresses/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const response = await AddressService.getAddressById(userId, params.id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_ADDRESS_BY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/addresses/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const body = await request.json();
    const validationResult = updateAddressSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid address update payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await AddressService.updateAddress(userId, params.id, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_UPDATE_ADDRESS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/addresses/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader || 'guest_customer_session';

    const response = await AddressService.deleteAddress(userId, params.id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_DELETE_ADDRESS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
