import { PaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { OrderRepository } from '@/features/orders/repositories/order.repository';
import { PaymentRepository } from '@/features/payments/repositories/payment.repository';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { ShipmentService } from '@/services/shipping/shipment.service';

/**
 * POST /api/v1/webhooks/razorpay
 *
 * Asynchronous Razorpay Webhook Handler.
 * Verifies webhook signature, processes payment events (payment.captured, payment.failed, order.paid),
 * updates order statuses, and maintains transaction audit logs idempotently.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay webhook signature header.' },
        { status: 400 },
      );
    }

    const isValidSignature = verifyRazorpayWebhookSignature(rawBody, signature);

    if (!isValidSignature) {
      console.warn('[RAZORPAY_WEBHOOK_INVALID_SIGNATURE_REJECTED]');
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature.' },
        { status: 400 },
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventPayload = payload.payload;

    console.log(`[RAZORPAY_WEBHOOK_RECEIVED] Event: ${event}`);

    switch (event) {
      case 'payment.captured': {
        const paymentEntity = eventPayload?.payment?.entity;
        if (paymentEntity) {
          const razorpayOrderId = paymentEntity.order_id;
          const razorpayPaymentId = paymentEntity.id;
          const amountInInr = (paymentEntity.amount || 0) / 100;

          const existingOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
          if (existingOrder) {
            if (existingOrder.paymentStatus !== PaymentStatus.PAID) {
              await OrderRepository.updatePaymentStatus(
                existingOrder.id,
                PaymentStatus.PAID,
                razorpayPaymentId,
              );
            }

            await PaymentRepository.createTransaction({
              orderId: existingOrder.id,
              razorpayOrderId,
              razorpayPaymentId,
              amount: amountInInr,
              currency: paymentEntity.currency || 'INR',
              status: PaymentStatus.PAID,
              method: paymentEntity.method,
              payload: paymentEntity,
            });

            // Trigger shipment creation asynchronously
            ShipmentService.createShipmentForOrder(existingOrder.id).catch((shipErr) => {
              console.error('[WEBHOOK_SHIPMENT_TRIGGER_ERROR]', shipErr);
            });
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = eventPayload?.payment?.entity;
        if (paymentEntity) {
          const razorpayOrderId = paymentEntity.order_id;
          const razorpayPaymentId = paymentEntity.id;
          const amountInInr = (paymentEntity.amount || 0) / 100;

          const existingOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
          if (existingOrder) {
            await PaymentRepository.createTransaction({
              orderId: existingOrder.id,
              razorpayOrderId,
              razorpayPaymentId,
              amount: amountInInr,
              currency: paymentEntity.currency || 'INR',
              status: PaymentStatus.FAILED,
              method: paymentEntity.method,
              errorCode: paymentEntity.error_code,
              errorDescription: paymentEntity.error_description,
              payload: paymentEntity,
            });
          }
        }
        break;
      }

      case 'order.paid': {
        const orderEntity = eventPayload?.order?.entity;
        if (orderEntity) {
          const razorpayOrderId = orderEntity.id;
          const existingOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
          if (existingOrder) {
            if (existingOrder.paymentStatus !== PaymentStatus.PAID) {
              await OrderRepository.updatePaymentStatus(existingOrder.id, PaymentStatus.PAID);
            }
            // Trigger shipment creation asynchronously
            ShipmentService.createShipmentForOrder(existingOrder.id).catch((shipErr) => {
              console.error('[WEBHOOK_ORDER_PAID_SHIPMENT_TRIGGER_ERROR]', shipErr);
            });
          }
        }
        break;
      }

      default:
        console.log(`[RAZORPAY_WEBHOOK_UNHANDLED_EVENT] ${event}`);
        break;
    }

    return NextResponse.json({ success: true, status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[RAZORPAY_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing error.' },
      { status: 500 },
    );
  }
}
