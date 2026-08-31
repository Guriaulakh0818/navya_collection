import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { OfferService } from '@/backend/services/offer.service';

/**
 * GET /api/v1/admin/offers
 * Returns list of all promotional offers for admin management.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const offers = await OfferService.listOffers();
    return NextResponse.json({
      success: true,
      data: offers,
    });
  } catch (error: any) {
    console.error('[ADMIN_OFFERS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch offers.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/admin/offers
 * Create a new offer.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (
      !currentUser ||
      !['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    if (!body.title || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Offer Title and Type are required.' },
        { status: 400 },
      );
    }

    const newOffer = await OfferService.createOffer({
      title: body.title,
      description: body.description,
      type: body.type,
      value: body.value !== undefined ? Number(body.value) : 0,
      minCartValue: body.minCartValue !== undefined ? Number(body.minCartValue) : 0,
      firstOrderOnly: Boolean(body.firstOrderOnly),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Offer created successfully!',
      data: newOffer,
    });
  } catch (error: any) {
    console.error('[ADMIN_OFFERS_CREATE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create offer.' },
      { status: 500 },
    );
  }
}
