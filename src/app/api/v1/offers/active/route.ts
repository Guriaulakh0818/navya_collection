import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { OfferService } from '@/backend/services/offer.service';

/**
 * GET /api/v1/offers/active
 * Returns currently active offers, along with user eligibility (e.g. first order check).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const activeOffers = await OfferService.getActiveOffers();
    const firstOrderInfo = await OfferService.isUserFirstOrder(user?.id);

    return NextResponse.json({
      success: true,
      data: {
        offers: activeOffers,
        user: {
          isLoggedIn: Boolean(user?.id),
          isFirstOrderEligible: firstOrderInfo.isEligible,
          orderCount: firstOrderInfo.orderCount,
        },
      },
    });
  } catch (error: any) {
    console.error('[PUBLIC_ACTIVE_OFFERS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch active offers.' },
      { status: 500 },
    );
  }
}
