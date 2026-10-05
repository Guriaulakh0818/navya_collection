import { ReturnStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { SettlementService } from '@/backend/services/settlement.service';
import { ReverseShipmentService } from '@/backend/services/shipping/reverse-shipment.service';
import { prisma } from '@/lib/prisma';

function maskAccountNumber(acc: string | null | undefined): string | null {
  if (!acc) return null;
  const cleaned = acc.trim();
  if (cleaned.length <= 4) return '••••' + cleaned;
  return '••••••••' + cleaned.slice(-4);
}

/**
 * Valid Transition Map (BM-08 Section 5)
 * Strict state machine enforcement:
 * REQUESTED -> APPROVED / REJECTED / CANCELLED / UNDER_REVIEW
 * APPROVED -> PICKUP_PENDING / PICKUP_INITIATED / REJECTED / CANCELLED
 * PICKUP_PENDING -> PICKUP_INITIATED / CANCELLED
 * PICKUP_INITIATED -> IN_TRANSIT / CANCELLED
 * IN_TRANSIT -> RECEIVED
 * RECEIVED -> VERIFIED / REJECTED
 * VERIFIED -> REFUND_PENDING / REPLACEMENT_PENDING / REFUNDED / REPLACED / CLOSED
 * REFUND_PENDING -> REFUNDED / CLOSED
 * REPLACEMENT_PENDING -> REPLACED / CLOSED
 * REFUNDED -> CLOSED
 * REPLACED -> CLOSED
 */
const ALLOWED_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PICKUP_PENDING', 'PICKUP_INITIATED', 'REJECTED', 'CANCELLED'],
  PICKUP_PENDING: ['PICKUP_INITIATED', 'CANCELLED'],
  PICKUP_INITIATED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['REFUND_PENDING', 'REPLACEMENT_PENDING', 'REFUNDED', 'REPLACED', 'CLOSED'],
  REFUND_PENDING: ['REFUNDED', 'CLOSED'],
  REPLACEMENT_PENDING: ['REPLACED', 'CLOSED'],
  REFUNDED: ['CLOSED'],
  REPLACED: ['CLOSED'],
  REJECTED: [],
  CANCELLED: [],
  CLOSED: [],
};

/**
 * GET /api/v1/admin/returns/[id]
 * Fetches comprehensive detail of a single return or replacement request.
 * Sensitive customer bank account information is safely masked.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const returnRequest = await prisma.returnRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, email: true, mobile: true } },
            address: true,
            shipments: true,
          },
        },
        vendorOrder: {
          include: {
            shop: {
              include: {
                owner: { select: { id: true, name: true, email: true, mobile: true } },
              },
            },
            settlement: true,
          },
        },
        shop: {
          include: {
            owner: { select: { id: true, name: true, email: true, mobile: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, mobile: true },
        },
        items: {
          include: {
            orderItem: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: { select: { id: true, name: true, role: true, email: true } },
          },
        },
        customerRefund: true,
        adjustments: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { success: false, message: 'Return request not found.' },
        { status: 404 },
      );
    }

    // Fetch Seller Packing Proofs for side-by-side comparison
    const packingProofs = await prisma.sellerPackingProof.findMany({
      where: { orderId: returnRequest.orderId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...returnRequest,
        bankAccountNumber: maskAccountNumber(returnRequest.bankAccountNumber),
        customerRefund: returnRequest.customerRefund
          ? {
              ...returnRequest.customerRefund,
              bankAccountNumber: maskAccountNumber(returnRequest.customerRefund.bankAccountNumber),
            }
          : null,
        sellerPackingProofs: packingProofs,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Return Detail Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch return request detail.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/admin/returns/[id]
 * Updates status, notes, shipping deductions, and coordinates settlement adjustments.
 * (BM-08 Section 4, 5, 14, 18, 20)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      status,
      adminNotes,
      rejectReason,
      forwardShippingCost,
      reverseShippingCost,
      reverseAwb,
      replacementAwb,
    } = body;

    const returnReq = await prisma.returnRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: {
        order: { include: { shipments: true } },
        vendorOrder: true,
      },
    });

    if (!returnReq) {
      return NextResponse.json(
        { success: false, message: 'Return request not found.' },
        { status: 404 },
      );
    }

    const previousStatus = returnReq.status;
    const targetStatus = (status || previousStatus) as ReturnStatus;

    // Validate valid enum value
    if (status && !Object.values(ReturnStatus).includes(targetStatus)) {
      return NextResponse.json(
        { success: false, message: `Invalid status: ${status}` },
        { status: 400 },
      );
    }

    // State Machine Transition Guard (BM-08 Section 5)
    if (status && targetStatus !== previousStatus) {
      const allowed = ALLOWED_TRANSITIONS[previousStatus] || [];
      if (!allowed.includes(targetStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid return status transition from ${previousStatus} to ${targetStatus}. Allowed transitions: ${allowed.join(', ') || 'None (Terminal status)'}.`,
          },
          { status: 400 },
        );
      }
    }

    // Determine actual shipping costs (BM-08 Section 20: Never fabricate costs)
    const matchedShipment = returnReq.order.shipments.find(
      (s) => s.vendorOrderId === returnReq.vendorOrderId || s.shopId === returnReq.shopId,
    );

    const resolvedForward: number | null =
      typeof forwardShippingCost === 'number'
        ? forwardShippingCost
        : returnReq.forwardShippingCost !== null && returnReq.forwardShippingCost !== undefined
          ? Number(returnReq.forwardShippingCost)
          : matchedShipment?.actualForwardShippingCost !== null &&
              matchedShipment?.actualForwardShippingCost !== undefined
            ? Number(matchedShipment.actualForwardShippingCost)
            : null;

    const resolvedReverse: number | null =
      typeof reverseShippingCost === 'number'
        ? reverseShippingCost
        : returnReq.reverseShippingCost !== null && returnReq.reverseShippingCost !== undefined
          ? Number(returnReq.reverseShippingCost)
          : matchedShipment?.actualReverseShippingCost !== null &&
              matchedShipment?.actualReverseShippingCost !== undefined
            ? Number(matchedShipment.actualReverseShippingCost)
            : null;

    let returnShippingDeduction = returnReq.returnShippingDeduction
      ? Number(returnReq.returnShippingDeduction)
      : 0;

    // 1. APPROVED Transition: Initiate reverse logistics (Shiprocket AWB/Tracking)
    // CRITICAL: DO NOT refund or trigger financial reversals at APPROVED! (BM-08 Section 4, 18)
    if (targetStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
      try {
        await ReverseShipmentService.createReverseShipment(returnReq.id, {
          updateStatusToPickup: false, // Keep status as APPROVED until courier pickup is scheduled
        });
      } catch (revErr: any) {
        console.warn('[REVERSE_SHIPMENT_CREATE_WARN]', revErr);
      }
    }

    // 2. VERIFIED Transition: Execute financial settlement and customer refund (BM-08 Section 4, 14, 15)
    // Quality inspection verified: disburse refund, reverse commission, restore inventory idempotently.
    if (
      (targetStatus === 'VERIFIED' || targetStatus === 'REFUNDED') &&
      previousStatus !== targetStatus
    ) {
      const verificationResult = await SettlementService.onReturnVerified({
        returnRequestId: returnReq.id,
        forwardShippingCost: resolvedForward,
        reverseShippingCost: resolvedReverse,
        performedById: admin.id,
        notes: adminNotes || 'Admin verified returned items and approved refund.',
      });
      returnShippingDeduction = verificationResult.returnShippingDeduction;
    }

    // 3. REJECTED or CANCELLED: Release settlement hold if no other open returns exist
    if (
      ['REJECTED', 'CANCELLED'].includes(targetStatus) &&
      !['REJECTED', 'CANCELLED'].includes(previousStatus)
    ) {
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
              performedById: admin.id,
              notes: `Hold released following rejection/cancellation of Return Request #${returnReq.requestNumber || returnReq.id}.`,
            },
          });
        }
      }
    }

    // Update the return request
    const updated = await prisma.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: targetStatus,
        adminNotes: adminNotes ?? returnReq.adminNotes,
        resolutionNotes: rejectReason ?? returnReq.resolutionNotes,
        forwardShippingCost: resolvedForward,
        reverseShippingCost: resolvedReverse,
        returnShippingDeduction,
        reverseAwbCode: reverseAwb ?? returnReq.reverseAwbCode,
        reviewedAt:
          ['APPROVED', 'REJECTED', 'REFUNDED', 'REPLACED', 'CLOSED'].includes(targetStatus) &&
          !returnReq.reviewedAt
            ? new Date()
            : returnReq.reviewedAt,
      },
    });

    // Record auditable history
    await prisma.returnAuditLog.create({
      data: {
        returnRequestId: returnReq.id,
        performedById: admin.id,
        action: `ADMIN_STATUS_UPDATE_${targetStatus}`,
        previousStatus,
        newStatus: targetStatus,
        reason:
          rejectReason || adminNotes || `Status updated from ${previousStatus} to ${targetStatus}`,
        metadata: {
          forwardShippingCost: resolvedForward,
          reverseShippingCost: resolvedReverse,
          returnShippingDeduction,
          reverseAwb,
          replacementAwb,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Return request #${returnReq.requestNumber || returnReq.id} updated to ${targetStatus}.`,
      data: {
        ...updated,
        bankAccountNumber: maskAccountNumber(updated.bankAccountNumber),
      },
    });
  } catch (error: any) {
    console.error('❌ PATCH Admin Return Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update return request.' },
      { status: 500 },
    );
  }
}
