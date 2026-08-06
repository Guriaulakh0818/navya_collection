import { NextRequest, NextResponse } from 'next/server';

import { updateCartItemSchema } from '@/features/cart/schemas/cart.schema';
import { CartService } from '@/features/cart/services/cart.service';
import { getCurrentUser } from '@/lib/session';

/**
 * PATCH /api/v1/cart/items/[itemId]
 *
 * Updates quantity for a cart item.
 */
export async function PATCH(request: NextRequest, { params }: { params: { itemId: string } }) {
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

    const { itemId } = params;
    const body = await request.json();
    const validationResult = updateCartItemSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid quantity.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CartService.updateItemQuantity(userId, itemId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_UPDATE_CART_ITEM_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/cart/items/[itemId]
 *
 * Removes a cart item.
 */
export async function DELETE(request: NextRequest, { params }: { params: { itemId: string } }) {
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

    const { itemId } = params;
    const response = await CartService.removeItem(userId, itemId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_REMOVE_CART_ITEM_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
