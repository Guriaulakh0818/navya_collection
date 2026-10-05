import { NextResponse } from 'next/server';

import { ShiprocketLogger } from '@/backend/services/shipping/logger';
import { ShiprocketCodService } from '@/backend/services/shipping/shiprocket-cod.service';

/**
 * POST /api/v1/webhooks/shiprocket/verification
 *
 * Dedicated receiver for Shiprocket Buyer Order Confirmation / COD Verification callbacks.
 * Idempotently updates order codVerificationStatus (VERIFIED, REJECTED, EXPIRED).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    ShiprocketLogger.info('[SHIPROCKET_COD_VERIFICATION_WEBHOOK_RECEIVED]', undefined, body);

    // Support flexible Shiprocket payload structures:
    // { order_id / order_number, status / verification_status, reference_id, channel }
    const orderNumber = body.order_number || body.order_id || body.orderId || body.orderNumber;
    const status =
      body.verification_status ||
      body.status ||
      (body.confirmed ? 'VERIFIED' : body.rejected ? 'REJECTED' : 'EXPIRED');
    const referenceId = body.reference_id || body.referenceId || body.id;

    if (!orderNumber || !status) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification webhook payload: missing order identifier or status.',
        },
        { status: 400 },
      );
    }

    const result = await ShiprocketCodService.handleVerificationWebhook({
      orderNumber: String(orderNumber),
      status: String(status),
      referenceId: referenceId ? String(referenceId) : undefined,
      channel: body.channel || 'shiprocket_whatsapp_ivr',
      timestamp: body.timestamp || new Date(),
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    ShiprocketLogger.error('[SHIPROCKET_COD_VERIFICATION_WEBHOOK_ERROR]', undefined, {
      error: error?.message,
    });
    return NextResponse.json(
      { success: false, message: error?.message || 'Error processing COD verification webhook.' },
      { status: 500 },
    );
  }
}
