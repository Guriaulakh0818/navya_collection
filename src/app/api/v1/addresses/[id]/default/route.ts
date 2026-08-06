import { NextRequest, NextResponse } from 'next/server';

import { AddressService } from '@/features/addresses/services/address.service';
import { getCurrentUser } from '@/lib/session';

/**
 * PATCH /api/v1/addresses/[id]/default
 *
 * Sets a specific address as default for the authenticated customer.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const userIdHeader = request.headers.get('x-user-id');
    const userId = user?.id || userIdHeader;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const response = await AddressService.setDefaultAddress(userId, params.id);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_SET_DEFAULT_ADDRESS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
