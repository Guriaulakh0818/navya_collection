import { NextRequest, NextResponse } from 'next/server';

import { addToWishlistSchema } from '@/features/wishlist/schemas/wishlist.schema';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/wishlist
 *
 * Retrieves the authenticated customer's database wishlist items.
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

    const response = await WishlistService.getWishlist(userId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_GET_WISHLIST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/wishlist
 *
 * Adds a product to customer's database wishlist.
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
    const validationResult = addToWishlistSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid product ID.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await WishlistService.addToWishlist(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_ADD_WISHLIST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
