import { NextRequest, NextResponse } from 'next/server';

import { WishlistService } from '@/features/wishlist/services/wishlist.service';
import { getCurrentUser } from '@/lib/session';

/**
 * DELETE /api/v1/wishlist/[productId]
 *
 * Removes a product from customer's database wishlist.
 */
export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
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

    const { productId } = params;
    const response = await WishlistService.removeFromWishlist(userId, productId);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_REMOVE_WISHLIST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
