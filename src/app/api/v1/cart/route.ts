import { NextRequest, NextResponse } from 'next/server';

import { CartService } from '@/features/cart/services/cart.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/cart
 *
 * Retrieves the authenticated customer's database cart.
 */
export async function GET(request: NextRequest) {
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

    const response = await CartService.getCart(userId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_CART_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/cart
 *
 * Clears all items in customer's active cart.
 */
export async function DELETE(request: NextRequest) {
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

    const response = await CartService.clearCart(userId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_DELETE_CART_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
