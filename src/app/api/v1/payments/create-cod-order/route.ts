import { NextResponse } from 'next/server';

import { PaymentService } from '@/features/payments/services/payment.service';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

/**
 * POST /api/v1/payments/create-cod-order
 *
 * Places an authoritative Cash on Delivery (COD) order.
 * - Strictly authenticated: requires valid customer session.
 * - Validates customer ownership of the selected delivery address.
 * - Enforces ₹5,000 product selling price subtotal limit.
 * - Records non-refundable 1.5% COD fee and dynamic tax snapshot.
 * - Enforces atomic inventory decrement.
 * - Initiates Shiprocket COD verification (shipment dispatch blocked until VERIFIED).
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to place a Cash on Delivery order.' },
        { status: 401 },
      );
    }
    const userId = user.id;

    const body = await request.json().catch(() => ({}));
    const { addressId, couponCode, items, shippingMethodCode } = body;

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Delivery address is required to place a COD order.' },
        { status: 400 },
      );
    }

    // Verify address belongs to the authenticated customer
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid delivery address. Address must belong to your account.',
        },
        { status: 400 },
      );
    }

    const result = await PaymentService.createCodOrder(userId, {
      addressId,
      couponCode,
      shippingMethodCode,
      items,
    });

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    console.error('[CREATE_COD_ORDER_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error placing COD order.' },
      { status: 500 },
    );
  }
}
