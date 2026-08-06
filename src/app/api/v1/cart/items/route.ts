import { NextRequest, NextResponse } from 'next/server';

import { addToCartSchema } from '@/features/cart/schemas/cart.schema';
import { CartService } from '@/features/cart/services/cart.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/cart/items
 *
 * Adds a product/variant item to the authenticated customer's cart.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validationResult = addToCartSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid input parameters.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CartService.addToCart(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADD_CART_ITEM_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
