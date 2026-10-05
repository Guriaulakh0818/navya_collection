import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || 'navya_whatsapp_verify_token_2026';

/**
 * GET /api/v1/webhooks/whatsapp
 * WhatsApp Cloud API / Meta Webhook verification challenge (Section 4).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ [WHATSAPP_WEBHOOK] Handshake verified successfully.');
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: 'Verification token mismatch' },
      { status: 403 },
    );
  } catch (error: any) {
    console.error('❌ [WHATSAPP_WEBHOOK_VERIFY_ERROR]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/webhooks/whatsapp
 * Receives inbound WhatsApp customer messages (Section 4).
 * Parses incoming message, extracts order or return reference, and links context for admin review.
 * Extensible structure: does not fake synchronization if inbound automation is not activated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Meta standard structure
    if (body.object !== 'whatsapp_business_account' && !body.entry) {
      return NextResponse.json(
        { success: false, message: 'Unrecognized webhook format' },
        { status: 400 },
      );
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value || !value.messages) continue;

        for (const msg of value.messages) {
          const from = msg.from; // Sender WhatsApp phone number
          const msgType = msg.type;
          const textBody = msg.text?.body || '';

          console.log(`📩 [WHATSAPP_INBOUND] From: ${from} | Type: ${msgType} | Text: ${textBody}`);

          // Extract potential Order ID or Return Request Number from textBody
          const orderMatch = textBody.match(/NC-[A-Z0-9-]+/i);
          const matchedIdentifier = orderMatch ? orderMatch[0].toUpperCase() : null;

          if (matchedIdentifier) {
            // Check if matches an existing ReturnRequest
            const matchedReturnReq = await prisma.returnRequest.findFirst({
              where: {
                OR: [
                  { requestNumber: matchedIdentifier },
                  { order: { orderNumber: matchedIdentifier } },
                ],
              },
            });

            if (matchedReturnReq) {
              await prisma.returnAuditLog.create({
                data: {
                  returnRequestId: matchedReturnReq.id,
                  performedById: matchedReturnReq.userId,
                  action: 'WHATSAPP_CUSTOMER_INBOUND_MESSAGE',
                  previousStatus: matchedReturnReq.status,
                  newStatus: matchedReturnReq.status,
                  reason: `Customer message received via WhatsApp from ${from}: "${textBody.slice(0, 200)}"`,
                  metadata: {
                    from,
                    msgId: msg.id,
                    timestamp: msg.timestamp,
                    textBody,
                  },
                },
              });
              console.log(
                `Linked inbound WhatsApp message to ReturnRequest #${matchedReturnReq.requestNumber}`,
              );
            }
          }
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Webhook event processed' },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('❌ [WHATSAPP_WEBHOOK_POST_ERROR]', error);
    // Return 200 to prevent Meta webhook retries on parse warnings
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
