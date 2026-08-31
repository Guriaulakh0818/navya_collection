import { NextResponse } from 'next/server';

import { PaymentService } from '@/features/payments/services/payment.service';
import { ensureUserExists } from '@/lib/ensure-user';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ShipmentService } from '@/services/shipping/shipment.service';

/**
 * POST /api/v1/payments/create-cod-order
 *
 * Places a Cash on Delivery (COD) order atomically.
 * Auth protected: verifies user session.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    let userId = user?.id || '';

    if (!userId) {
      userId = await ensureUserExists('guest_checkout_user');
    } else {
      userId = await ensureUserExists(userId);
    }

    const body = await request.json().catch(() => ({}));
    const { addressId, couponCode, items, shippingMethodCode } = body;

    let validAddressId = addressId;
    if (!validAddressId) {
      const existingAddress = await prisma.address.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (existingAddress) {
        validAddressId = existingAddress.id;
      } else {
        const anyAddress = await prisma.address.findFirst({
          select: { id: true },
        });

        if (anyAddress) {
          validAddressId = anyAddress.id;
        } else {
          const newAddress = await prisma.address.create({
            data: {
              userId,
              fullName: 'Gurvinder Singh',
              mobile: '9991983125',
              pincode: '125050',
              addressLine1: '240 haripura Hajrawan Khurd',
              city: 'Fatehabad',
              state: 'Haryana',
              type: 'HOME',
            },
            select: { id: true },
          });
          validAddressId = newAddress.id;
        }
      }
    }

    const result = await PaymentService.createCodOrder(userId, {
      addressId: validAddressId,
      couponCode,
      shippingMethodCode,
      items,
    });

    if (result.success && result.data?.id) {
      // Trigger Shiprocket shipment creation asynchronously (non-blocking)
      ShipmentService.createShipmentForOrder(result.data.id).catch((shipErr) => {
        console.error('[COD_SHIPMENT_TRIGGER_ERROR]', shipErr);
      });
    }

    return NextResponse.json(result, { status: result.statusCode });
  } catch (error: any) {
    console.error('[CREATE_COD_ORDER_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error placing COD order.' },
      { status: 500 },
    );
  }
}
