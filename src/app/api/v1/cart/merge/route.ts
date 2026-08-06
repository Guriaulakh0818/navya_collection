import { NextRequest, NextResponse } from 'next/server';

import { mergeCartSchema } from '@/features/cart/schemas/cart.schema';
import { CartService } from '@/features/cart/services/cart.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/cart/merge
 *
 * Merges guest localStorage cart items into customer's database cart upon login.
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
    const validationResult = mergeCartSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid merge cart payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await CartService.mergeCart(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_MERGE_CART_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
