import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { SettlementService } from '@/backend/services/settlement.service';
import { generateWhatsAppReturnUrl } from '@/backend/services/whatsapp.service';
import { prisma } from '@/lib/prisma';

// Indian IFSC Regex: 4 alpha characters, digit 0, 6 alphanumeric characters
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// Standard UPI ID Regex
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
// Bank Account Number Regex (6 to 20 digits)
const BANK_ACCOUNT_REGEX = /^\d{6,20}$/;

function maskAccountNumber(acc: string | null | undefined): string | null {
  if (!acc) return null;
  const cleaned = acc.trim();
  if (cleaned.length <= 4) return '••••' + cleaned;
  return '••••••••' + cleaned.slice(-4);
}

/**
 * POST /api/v1/orders/[id]/return
 *
 * Initiates an official Return or Replacement request with strict server-side policy and date enforcement (BM-08).
 * Enforces:
 * - Return: policy allows return AND current date <= delivery date + 3 days
 * - Replacement: policy allows replacement AND current date <= delivery date + 7 days
 * - Partial Quantity: 1 <= quantity <= (ordered - previously returned)
 * - COD refund destination validation (Bank or UPI)
 * - Proportional coupon and tax adjusted refund calculation
 * - Puts affected seller settlement ON_HOLD for financial safety
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderIdOrNumber } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            returnItems: {
              include: { returnRequest: true },
            },
          },
        },
        shipments: true,
        vendorOrders: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const isOwner = order.userId === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Forbidden. You do not have permission to request a return for this order.',
        },
        { status: 403 },
      );
    }

    // 1. Verify Order Delivery Status
    const isDelivered =
      order.orderStatus === 'DELIVERED' ||
      order.shippingStatus === 'DELIVERED' ||
      order.shipments.some((s) => s.status === 'DELIVERED');

    if (!isDelivered) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Returns or replacements can only be initiated after the order has been delivered.',
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      orderItemId,
      quantity = 1,
      requestType = 'RETURN', // 'RETURN' | 'EXCHANGE'
      reason,
      detailedReason,
      customerEvidenceUrls = [],
      refundMethod: inputRefundMethod,
      bankAccountNumber,
      bankIfsc,
      accountHolderName,
      upiId,
    } = body;

    if (!orderItemId || !reason) {
      return NextResponse.json(
        { success: false, message: 'Order Item ID and return reason are required.' },
        { status: 400 },
      );
    }

    const targetItem = order.items.find((item) => item.id === orderItemId);
    if (!targetItem) {
      return NextResponse.json(
        { success: false, message: 'Selected item not found in this order.' },
        { status: 404 },
      );
    }

    // 2. Validate Partial Quantity (BM-08 Section 15)
    const returnQty = Number(quantity);
    if (!Number.isInteger(returnQty) || returnQty < 1) {
      return NextResponse.json(
        { success: false, message: 'Return quantity must be an integer of at least 1.' },
        { status: 400 },
      );
    }

    if (returnQty > targetItem.quantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Return quantity (${returnQty}) cannot exceed ordered quantity (${targetItem.quantity}).`,
        },
        { status: 400 },
      );
    }

    // Calculate sum of active/completed returned quantities for this item
    const previouslyReturnedQty =
      targetItem.returnItems
        ?.filter(
          (ri) => ri.returnRequest && !['REJECTED', 'CANCELLED'].includes(ri.returnRequest.status),
        )
        .reduce((sum, ri) => sum + (ri.quantity || 1), 0) || 0;

    const availableToReturn = targetItem.quantity - previouslyReturnedQty;

    if (returnQty > availableToReturn) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot return ${returnQty} unit(s). You have already returned/requested ${previouslyReturnedQty} of ${targetItem.quantity} ordered. Maximum available to return is ${availableToReturn}.`,
        },
        { status: 400 },
      );
    }

    // Determine Delivery Date (fallback to shipment or order updated time)
    const matchedShipment = order.shipments.find(
      (s) => s.vendorOrderId === targetItem.vendorOrderId || s.shopId === targetItem.shopId,
    );
    const deliveryDate =
      targetItem.deliveredAt || matchedShipment?.deliveredAt || order.updatedAt || new Date();

    const deliveryTime = new Date(deliveryDate).getTime();
    const nowTime = Date.now();

    // 3. Strict Server-Side Policy & Window Enforcement (BM-08 Section 1, 3)
    const isReturn = requestType === 'RETURN';

    if (isReturn) {
      // Must allow return
      if (
        !targetItem.returnAllowed ||
        targetItem.policyType === 'REPLACEMENT_ONLY' ||
        targetItem.policyType === 'NONE'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This product policy does not permit returns (Replacement Only or Final Sale).',
          },
          { status: 400 },
        );
      }

      // Max 3 calendar days from delivery
      const returnWindowMs = (targetItem.returnWindowDays || 3) * 24 * 60 * 60 * 1000;
      if (nowTime > deliveryTime + returnWindowMs) {
        return NextResponse.json(
          {
            success: false,
            message: `Return window of ${targetItem.returnWindowDays || 3} days has expired. Returns are no longer accepted for this item.`,
          },
          { status: 400 },
        );
      }
    } else {
      // Must allow replacement
      if (!targetItem.replacementAllowed || targetItem.policyType === 'NONE') {
        return NextResponse.json(
          {
            success: false,
            message: 'This product policy does not permit replacements (Final Sale).',
          },
          { status: 400 },
        );
      }

      // Max 7 calendar days from delivery
      const replacementWindowMs = (targetItem.replacementWindowDays || 7) * 24 * 60 * 60 * 1000;
      if (nowTime > deliveryTime + replacementWindowMs) {
        return NextResponse.json(
          {
            success: false,
            message: `Replacement window of ${targetItem.replacementWindowDays || 7} days has expired. Replacements are no longer accepted for this item.`,
          },
          { status: 400 },
        );
      }
    }

    // 4. Validate COD Refund Details (BM-08 Section 6)
    let finalRefundMethod: string | null = null;
    let validatedBankAcc: string | null = null;
    let validatedIfsc: string | null = null;
    let validatedHolder: string | null = null;
    let validatedUpi: string | null = null;

    if (isReturn) {
      if (order.paymentMethod === 'COD') {
        const method = (inputRefundMethod || '').toUpperCase();
        const hasBankInputs = !!(bankAccountNumber || bankIfsc || accountHolderName);
        const hasUpiInput = !!upiId;

        if (method === 'UPI' || (!method && hasUpiInput && !hasBankInputs)) {
          finalRefundMethod = 'UPI';
          const trimmedUpi = (upiId || '').trim();
          if (!trimmedUpi || !UPI_REGEX.test(trimmedUpi)) {
            return NextResponse.json(
              {
                success: false,
                message: 'A valid UPI ID is required for COD refund (e.g., username@okaxis).',
              },
              { status: 400 },
            );
          }
          validatedUpi = trimmedUpi;
        } else if (method === 'BANK' || (!method && hasBankInputs)) {
          finalRefundMethod = 'BANK';
          const trimmedAcc = (bankAccountNumber || '').toString().trim();
          const trimmedIfsc = (bankIfsc || '').trim().toUpperCase();
          const trimmedHolder = (accountHolderName || '').trim();

          if (!trimmedHolder || trimmedHolder.length < 2) {
            return NextResponse.json(
              {
                success: false,
                message: 'Account holder name is required for bank transfer refund.',
              },
              { status: 400 },
            );
          }

          if (!trimmedAcc || !BANK_ACCOUNT_REGEX.test(trimmedAcc)) {
            return NextResponse.json(
              {
                success: false,
                message: 'A valid bank account number (6 to 20 digits) is required.',
              },
              { status: 400 },
            );
          }

          if (!trimmedIfsc || !IFSC_REGEX.test(trimmedIfsc)) {
            return NextResponse.json(
              {
                success: false,
                message: 'A valid 11-character Indian IFSC code is required (e.g., HDFC0001234).',
              },
              { status: 400 },
            );
          }

          validatedBankAcc = trimmedAcc;
          validatedIfsc = trimmedIfsc;
          validatedHolder = trimmedHolder;
        } else {
          return NextResponse.json(
            {
              success: false,
              message:
                'For Cash on Delivery orders, please provide either Bank Account details (Account Number, IFSC, Account Holder) or a valid UPI ID for your refund.',
            },
            { status: 400 },
          );
        }
      } else {
        // Prepaid order -> Original payment method
        finalRefundMethod = 'ORIGINAL_PAYMENT';
      }
    }

    // 5. Authoritative Refund Amount Calculation (BM-08 Section 9, 10, 11, 12)
    // Product Value = Selling Price * Quantity - Proportional Coupon + Applicable Customer Tax
    let calculatedRefund: number | null = null;

    if (isReturn) {
      const itemPrice = Number(targetItem.price || 0);
      const itemOrderQty = Number(targetItem.quantity || 1);
      const lineItemSellingValue = Math.round(itemPrice * returnQty * 100) / 100;

      // Proportional coupon discount
      let itemCoupon = 0;
      const orderDiscount = Number(order.discountAmount || 0);
      const orderSubtotal = Number(order.totalAmount || 0);
      if (targetItem.navyaCouponAmount && Number(targetItem.navyaCouponAmount) > 0) {
        itemCoupon =
          Math.round((Number(targetItem.navyaCouponAmount) / itemOrderQty) * returnQty * 100) / 100;
      } else if (orderDiscount > 0 && orderSubtotal > 0) {
        itemCoupon = Math.round((lineItemSellingValue / orderSubtotal) * orderDiscount * 100) / 100;
      }

      // Applicable returned customer tax
      let itemTax = 0;
      if (targetItem.sellerGstStatus === 'REGISTERED') {
        if (targetItem.taxAmount && Number(targetItem.taxAmount) > 0) {
          itemTax =
            Math.round((Number(targetItem.taxAmount) / itemOrderQty) * returnQty * 100) / 100;
        } else if (targetItem.taxRate && Number(targetItem.taxRate) > 0) {
          itemTax =
            Math.round(lineItemSellingValue * (Number(targetItem.taxRate) / 100) * 100) / 100;
        }
      }

      // Customer Refund excludes customer shipping and non-refundable COD fee
      calculatedRefund = Math.max(
        0,
        Math.round((lineItemSellingValue - itemCoupon + itemTax) * 100) / 100,
      );
    }

    // 6. Atomically Create ReturnRequest and Put Settlement ON_HOLD
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestNumber = `NC-RET-${timestamp}-${randomSuffix}`;

    const returnReq = await prisma.$transaction(async (tx) => {
      const created = await tx.returnRequest.create({
        data: {
          requestNumber,
          orderId: order.id,
          vendorOrderId: targetItem.vendorOrderId || null,
          shopId: targetItem.shopId || null,
          userId: user.id,
          type: isReturn ? 'RETURN' : 'EXCHANGE',
          reason,
          detailedReason: detailedReason || null,
          status: 'REQUESTED',
          refundAmount: calculatedRefund,
          customerEvidenceUrls: Array.isArray(customerEvidenceUrls) ? customerEvidenceUrls : [],
          deliveryDate,
          policyApplicable: targetItem.policyType || 'RETURN_AND_REPLACEMENT',
          refundMethod: finalRefundMethod,
          bankAccountNumber: validatedBankAcc,
          bankIfsc: validatedIfsc,
          accountHolderName: validatedHolder,
          upiId: validatedUpi,
        },
      });

      await tx.returnItem.create({
        data: {
          returnRequestId: created.id,
          orderItemId: targetItem.id,
          quantity: returnQty,
          reason,
        },
      });

      // Audit Log
      await tx.returnAuditLog.create({
        data: {
          returnRequestId: created.id,
          performedById: user.id,
          action: 'CUSTOMER_RAISED_REQUEST',
          previousStatus: 'NONE',
          newStatus: 'REQUESTED',
          reason: detailedReason || reason,
          metadata: {
            quantity: returnQty,
            refundMethod: finalRefundMethod,
            calculatedRefund,
          },
        },
      });

      return created;
    });

    // Put affected Seller Settlement ON_HOLD asynchronously
    SettlementService.onReturnRaised(returnReq.id).catch((err) => {
      console.warn('[SETTLEMENT_HOLD_TRIGGER_ERROR]', err);
    });

    // Generate WhatsApp direct continuation URL
    const whatsAppUrl = generateWhatsAppReturnUrl({
      orderNumber: order.orderNumber,
      productName: targetItem.name,
      requestType: isReturn ? 'Return' : 'Replacement',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Your ${isReturn ? 'return' : 'replacement'} request (#${requestNumber}) for ${returnQty} item(s) has been submitted successfully for verification.`,
        data: {
          returnRequest: {
            ...returnReq,
            bankAccountNumber: maskAccountNumber(returnReq.bankAccountNumber),
          },
          whatsAppUrl,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('❌ POST Order Return Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit return request.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/orders/[id]/return
 * Customer cancellation of a return/replacement request (BM-08 Section 22).
 * Allowed only while in 'REQUESTED' status.
 * Releases seller settlement hold if no other open returns exist.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderIdOrNumber } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { returnRequestId, cancellationReason } = body;

    if (!returnRequestId) {
      return NextResponse.json(
        { success: false, message: 'Return Request ID is required for cancellation.' },
        { status: 400 },
      );
    }

    const returnReq = await prisma.returnRequest.findFirst({
      where: {
        OR: [{ id: returnRequestId }, { requestNumber: returnRequestId }],
      },
      include: {
        order: true,
      },
    });

    if (!returnReq) {
      return NextResponse.json(
        { success: false, message: 'Return request not found.' },
        { status: 404 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const isOwner = returnReq.userId === user.id || returnReq.order.userId === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You cannot cancel this return request.' },
        { status: 403 },
      );
    }

    // Cancellation guard: only allowed while in 'REQUESTED' (or 'UNDER_REVIEW')
    if (!['REQUESTED', 'UNDER_REVIEW'].includes(returnReq.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Return request cannot be cancelled once pickup or processing has initiated (Current status: ${returnReq.status}).`,
        },
        { status: 400 },
      );
    }

    const previousStatus = returnReq.status;

    // Update status to CANCELLED
    const updated = await prisma.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: 'CANCELLED',
        resolutionNotes: cancellationReason || 'Customer requested return cancellation.',
      },
    });

    // Create Audit Log
    await prisma.returnAuditLog.create({
      data: {
        returnRequestId: returnReq.id,
        performedById: user.id,
        action: 'CUSTOMER_CANCELLED_RETURN',
        previousStatus,
        newStatus: 'CANCELLED',
        reason: cancellationReason || 'Customer cancelled the return request.',
      },
    });

    // Release settlement hold if no other open returns exist for this order/vendorOrder
    const otherActiveReturns = await prisma.returnRequest.count({
      where: {
        orderId: returnReq.orderId,
        id: { not: returnReq.id },
        status: { notIn: ['REJECTED', 'CANCELLED', 'CLOSED'] },
      },
    });

    if (otherActiveReturns === 0) {
      const settlement = await prisma.sellerSettlement.findFirst({
        where: {
          OR: [
            ...(returnReq.vendorOrderId ? [{ vendorOrderId: returnReq.vendorOrderId }] : []),
            { masterOrderId: returnReq.orderId },
          ],
        },
      });

      if (settlement && settlement.status === 'ON_HOLD') {
        const simulated = { ...settlement, status: 'PENDING_SETTLEMENT' };
        const eligibility = await SettlementService.isSettlementEligible(simulated as any);

        await prisma.sellerSettlement.update({
          where: { id: settlement.id },
          data: {
            status: eligibility.eligible ? 'ELIGIBLE_FOR_SETTLEMENT' : 'PENDING_SETTLEMENT',
            holdReason: null,
          },
        });

        await prisma.financialAuditLog.create({
          data: {
            entityType: 'SETTLEMENT',
            entityId: settlement.id,
            action: 'SETTLEMENT_HOLD_RELEASED',
            performedById: user.id,
            notes: `Hold released following customer cancellation of Return Request #${returnReq.requestNumber || returnReq.id}.`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Return request has been cancelled successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('❌ PATCH Customer Return Cancellation Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel return request.' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/orders/[id]/return
 * Returns all return/replacement requests for an order.
 * Sensitive bank account numbers are safely masked.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderIdOrNumber } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      select: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    if (order.userId !== user.id && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const requests = await prisma.returnRequest.findMany({
      where: { orderId: order.id },
      include: {
        items: { include: { orderItem: true } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        customerRefund: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask sensitive details before responding
    const safeRequests = requests.map((req) => ({
      ...req,
      bankAccountNumber: maskAccountNumber(req.bankAccountNumber),
      customerRefund: req.customerRefund
        ? {
            ...req.customerRefund,
            bankAccountNumber: maskAccountNumber(req.customerRefund.bankAccountNumber),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: safeRequests,
    });
  } catch (error: any) {
    console.error('❌ GET Order Returns Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
