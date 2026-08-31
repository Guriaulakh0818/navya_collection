import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { OfferService } from '@/backend/services/offer.service';

/**
 * PUT /api/v1/admin/offers/[id]
 * Updates or toggles an offer.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const body = await request.json();

    const updated = await OfferService.updateOffer(id, body);
    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully!',
      data: updated,
    });
  } catch (error: any) {
    console.error('[ADMIN_OFFERS_PUT_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update offer.' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/admin/offers/[id]
 * Deletes an offer permanently.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    await OfferService.deleteOffer(id);

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully.',
    });
  } catch (error: any) {
    console.error('[ADMIN_OFFERS_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete offer.' },
      { status: 500 },
    );
  }
}
