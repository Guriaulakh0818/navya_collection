import { PaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

import { OrderRepository } from '@/features/orders/repositories/order.repository';
import { PaymentIntentRepository } from '@/features/payments/repositories/payment-intent.repository';
import { PaymentRepository } from '@/features/payments/repositories/payment.repository';
import { PaymentService } from '@/features/payments/services/payment.service';
import { prisma } from '@/lib/prisma';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { ShipmentService } from '@/services/shipping/shipment.service';

/**
 * POST /api/v1/webhooks/razorpay
 *
 * Asynchronous Razorpay Webhook Handler (BM-06 Authoritative Architecture).
 * - Verifies cryptographic HMAC-SHA256 signature
 * - Enforces DB-level idempotency via PaymentWebhookEvent
 * - Recovers and fulfills orphaned payments from PaymentIntent if client drops off
 * - Handles payment.captured, payment.failed, refund.processed, and refund.failed
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

    // Resolve event identifier for idempotency
    const paymentEntity = eventPayload?.payment?.entity;
    const orderEntity = eventPayload?.order?.entity;
    const refundEntity = eventPayload?.refund?.entity;

    const razorpayOrderId =
      paymentEntity?.order_id || orderEntity?.id || refundEntity?.payment_id || null;
    const razorpayPaymentId = paymentEntity?.id || refundEntity?.payment_id || null;

    const eventId =
      request.headers.get('x-razorpay-event-id') ||
      payload.event_id ||
      `${event}_${razorpayPaymentId || razorpayOrderId || Date.now()}`;

    // 1. Idempotency Check
    const alreadyProcessed = await PaymentIntentRepository.isWebhookEventProcessed(eventId);
    if (alreadyProcessed) {
      return NextResponse.json(
        { success: true, message: 'Webhook event already processed (idempotent).' },
        { status: 200 },
      );
    }

    console.log(`[RAZORPAY_WEBHOOK_RECEIVED] Event: ${event}, OrderId: ${razorpayOrderId}`);

    switch (event) {
      case 'payment.captured': {
        if (paymentEntity) {
          const amountInInr = (paymentEntity.amount || 0) / 100;
          const feeInInr = (paymentEntity.fee || 0) / 100;
          const taxInInr = (paymentEntity.tax || 0) / 100;
          const netInr = amountInInr - feeInInr;

          let targetOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);

          // CRITICAL: Orphan Payment Recovery (DECISION 1)
          if (!targetOrder && razorpayOrderId) {
            console.log(`[WEBHOOK_ORPHAN_RECOVERY_ATTEMPT] Recovering OrderId: ${razorpayOrderId}`);
            targetOrder = await PaymentService.recoverAndFulfillOrphanPayment(
              razorpayOrderId,
              razorpayPaymentId,
            );
          }

          if (targetOrder) {
            if (targetOrder.paymentStatus !== PaymentStatus.PAID) {
              await OrderRepository.updatePaymentStatus(
                targetOrder.id,
                PaymentStatus.PAID,
                razorpayPaymentId,
              );
            }

            // Create/Update PaymentTransaction idempotently
            const existingTxn = await PaymentRepository.findByRazorpayPaymentId(razorpayPaymentId);
            if (!existingTxn) {
              await PaymentRepository.createTransaction({
                orderId: targetOrder.id,
                razorpayOrderId,
                razorpayPaymentId,
                amount: amountInInr,
                currency: paymentEntity.currency || 'INR',
                status: PaymentStatus.PAID,
                method: paymentEntity.method,
                gatewayFee: feeInInr,
                gatewayTax: taxInInr,
                netAmount: netInr,
                gatewayFeeStatus: 'ACTUAL',
                payload: paymentEntity,
              });
            } else {
              await PaymentRepository.updateTransactionFee(razorpayPaymentId, {
                gatewayFee: feeInInr,
                gatewayTax: taxInInr,
                netAmount: netInr,
                gatewayFeeStatus: 'ACTUAL',
              });
            }

            // Record Gateway Fee in financial ledger
            if (feeInInr > 0) {
              await prisma.financialAuditLog
                .upsert({
                  where: { idempotencyKey: `GW_FEE_ACTUAL:${targetOrder.id}` },
                  update: {
                    amount: feeInInr,
                    notes: `Actual Razorpay fee: ₹${feeInInr}, tax: ₹${taxInInr}, net: ₹${netInr}`,
                  },
                  create: {
                    entityType: 'GATEWAY_FEE',
                    entityId: targetOrder.id,
                    action: 'RECORD_GATEWAY_FEE_ACTUAL',
                    amount: feeInInr,
                    notes: `Actual Razorpay fee: ₹${feeInInr}, tax: ₹${taxInInr}, net: ₹${netInr}`,
                    idempotencyKey: `GW_FEE_ACTUAL:${targetOrder.id}`,
                  },
                })
                .catch(() => {});
            }

            // BM-11: Reconcile contribution with actual gateway fee
            try {
              const { ContributionService } =
                await import('@/backend/services/contribution.service');
              await ContributionService.syncActualGatewayFee({
                orderId: targetOrder.id,
                razorpayPaymentId,
                actualFee: feeInInr,
                actualTax: taxInInr,
              });
            } catch (cErr) {
              console.warn('[BM11_GATEWAY_FEE_SYNC_WARN]', cErr);
            }

            // Trigger shipment creation asynchronously
            ShipmentService.createShipmentForOrder(targetOrder.id).catch((shipErr) => {
              console.error('[WEBHOOK_SHIPMENT_TRIGGER_ERROR]', shipErr);
            });
          }
        }
        break;
      }

      case 'payment.failed': {
        if (paymentEntity) {
          const amountInInr = (paymentEntity.amount || 0) / 100;
          const targetOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);

          if (targetOrder) {
            await PaymentRepository.createTransaction({
              orderId: targetOrder.id,
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

          if (razorpayOrderId) {
            await PaymentIntentRepository.updateStatus(razorpayOrderId, 'FAILED', {
              razorpayPaymentId,
              failureReason:
                paymentEntity.error_description || paymentEntity.error_code || 'Payment failed',
            });
          }
        }
        break;
      }

      case 'refund.processed': {
        if (refundEntity) {
          const refundId = refundEntity.id;
          const refundAmount = (refundEntity.amount || 0) / 100;

          // Find CustomerRefund record by razorpayRefundId
          const customerRefund = await prisma.customerRefund.findFirst({
            where: {
              OR: [{ razorpayRefundId: refundId }, { refundTransaction: refundId }],
            },
          });

          if (customerRefund) {
            await prisma.customerRefund.update({
              where: { id: customerRefund.id },
              data: {
                status: PaymentStatus.PAID, // Refund has been settled
                gatewayRefundStatus: 'PROCESSED',
                refundedAt: new Date(),
              },
            });

            await prisma.financialAuditLog
              .create({
                data: {
                  entityType: 'REFUND',
                  entityId: customerRefund.id,
                  action: 'REFUND_PROCESSED_WEBHOOK',
                  amount: refundAmount,
                  notes: `Razorpay refund ${refundId} confirmed processed`,
                },
              })
              .catch(() => {});
          }
        }
        break;
      }

      case 'refund.failed': {
        if (refundEntity) {
          const refundId = refundEntity.id;
          const failureReason = refundEntity.error_description || 'Refund failed at gateway';

          const customerRefund = await prisma.customerRefund.findFirst({
            where: {
              OR: [{ razorpayRefundId: refundId }, { refundTransaction: refundId }],
            },
          });

          if (customerRefund) {
            await prisma.customerRefund.update({
              where: { id: customerRefund.id },
              data: {
                status: PaymentStatus.FAILED,
                gatewayRefundStatus: 'FAILED',
                failureReason,
              },
            });

            await prisma.financialAuditLog
              .create({
                data: {
                  entityType: 'REFUND',
                  entityId: customerRefund.id,
                  action: 'REFUND_FAILED_WEBHOOK',
                  notes: `Razorpay refund ${refundId} failed: ${failureReason}`,
                },
              })
              .catch(() => {});
          }
        }
        break;
      }

      case 'order.paid': {
        if (orderEntity) {
          const rzpOrderId = orderEntity.id;
          const existingOrder = await OrderRepository.findByRazorpayOrderId(rzpOrderId);
          if (existingOrder && existingOrder.paymentStatus !== PaymentStatus.PAID) {
            await OrderRepository.updatePaymentStatus(existingOrder.id, PaymentStatus.PAID);
            ShipmentService.createShipmentForOrder(existingOrder.id).catch((shipErr) => {
              console.error('[WEBHOOK_ORDER_PAID_SHIPMENT_TRIGGER_ERROR]', shipErr);
            });
          }
        }
        break;
      }

      case 'payout.processed': {
        const payoutEntity = eventPayload?.payout?.entity;
        if (payoutEntity) {
          const payoutId = payoutEntity.id;
          const refId = payoutEntity.reference_id;
          const payoutAmount = (payoutEntity.amount || 0) / 100;

          const customerRefund = await prisma.customerRefund.findFirst({
            where: {
              OR: [
                ...(payoutId ? [{ payoutReference: payoutId }] : []),
                ...(refId ? [{ payoutReference: refId }] : []),
              ],
            },
          });

          if (customerRefund) {
            await prisma.customerRefund.update({
              where: { id: customerRefund.id },
              data: {
                status: PaymentStatus.PAID,
                payoutStatus: 'PROCESSED',
                gatewayRefundStatus: 'PROCESSED',
                refundedAt: new Date(),
              },
            });

            await prisma.financialAuditLog
              .create({
                data: {
                  entityType: 'PAYOUT',
                  entityId: customerRefund.id,
                  action: 'COD_PAYOUT_PROCESSED_WEBHOOK',
                  amount: payoutAmount,
                  notes: `Razorpay payout ${payoutId} confirmed processed for COD customer refund`,
                },
              })
              .catch(() => {});
          }
        }
        break;
      }

      case 'payout.failed': {
        const payoutEntity = eventPayload?.payout?.entity;
        if (payoutEntity) {
          const payoutId = payoutEntity.id;
          const refId = payoutEntity.reference_id;
          const failureReason = payoutEntity.failure_reason || 'Payout failed at bank/gateway';

          const customerRefund = await prisma.customerRefund.findFirst({
            where: {
              OR: [
                ...(payoutId ? [{ payoutReference: payoutId }] : []),
                ...(refId ? [{ payoutReference: refId }] : []),
              ],
            },
          });

          if (customerRefund) {
            await prisma.customerRefund.update({
              where: { id: customerRefund.id },
              data: {
                status: PaymentStatus.FAILED,
                payoutStatus: 'FAILED',
                gatewayRefundStatus: 'FAILED',
                failureReason,
              },
            });

            await prisma.financialAuditLog
              .create({
                data: {
                  entityType: 'PAYOUT',
                  entityId: customerRefund.id,
                  action: 'COD_PAYOUT_FAILED_WEBHOOK',
                  notes: `Razorpay payout ${payoutId} failed: ${failureReason}`,
                },
              })
              .catch(() => {});
          }
        }
        break;
      }

      case 'payout.reversed': {
        const payoutEntity = eventPayload?.payout?.entity;
        if (payoutEntity) {
          const payoutId = payoutEntity.id;
          const refId = payoutEntity.reference_id;

          const customerRefund = await prisma.customerRefund.findFirst({
            where: {
              OR: [
                ...(payoutId ? [{ payoutReference: payoutId }] : []),
                ...(refId ? [{ payoutReference: refId }] : []),
              ],
            },
          });

          if (customerRefund) {
            await prisma.customerRefund.update({
              where: { id: customerRefund.id },
              data: {
                status: PaymentStatus.FAILED,
                payoutStatus: 'REVERSED',
                gatewayRefundStatus: 'FAILED',
                failureReason: 'Payout reversed by bank',
              },
            });

            await prisma.financialAuditLog
              .create({
                data: {
                  entityType: 'PAYOUT',
                  entityId: customerRefund.id,
                  action: 'COD_PAYOUT_REVERSED_WEBHOOK',
                  notes: `Razorpay payout ${payoutId} reversed by banking partner`,
                },
              })
              .catch(() => {});
          }
        }
        break;
      }

      default:
        console.log(`[RAZORPAY_WEBHOOK_UNHANDLED_EVENT] ${event}`);
        break;
    }

    // 2. Persist Webhook Event Idempotency Record
    await PaymentIntentRepository.recordWebhookEvent({
      eventId,
      eventType: event,
      razorpayOrderId,
      razorpayPaymentId,
      payload,
      status: 'PROCESSED',
    });

    return NextResponse.json({ success: true, status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('[RAZORPAY_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing error.' },
      { status: 500 },
    );
  }
}
