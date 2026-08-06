import { NextRequest, NextResponse } from 'next/server';

import { mergeWishlistSchema } from '@/features/wishlist/schemas/wishlist.schema';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/wishlist/merge
 *
 * Merges guest localStorage wishlist product IDs into customer's database wishlist upon login.
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
    const validationResult = mergeWishlistSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMsg =
        validationResult.error.issues[0]?.message || 'Invalid merge wishlist payload.';
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const response = await WishlistService.mergeWishlist(userId, validationResult.data);
    return NextResponse.json(response, { status: response.statusCode });
  } catch (error: any) {
    console.error('[API_MERGE_WISHLIST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
