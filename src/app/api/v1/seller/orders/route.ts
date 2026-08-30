import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AwbService } from '@/backend/services/shipping/awb.service';
import { LabelService } from '@/backend/services/shipping/label.service';
import { MultiSellerShipmentService } from '@/backend/services/shipping/multi-seller-shipment.service';
import { PickupService } from '@/backend/services/shipping/pickup.service';
import { StatusAggregatorService } from '@/backend/services/shipping/status-aggregator.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/seller/orders
 * Returns Vendor Orders & Shipments belonging to the authenticated seller's shop.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get('shopId');
    const status = searchParams.get('status');
    const query = (searchParams.get('q') || '').trim();

    let targetShopId: string | null = null;

    if (isAdmin && shopIdParam) {
      targetShopId = shopIdParam;
    } else {
      const shop = await prisma.shop.findFirst({
        where: { ownerId: currentUser.id, deletedAt: null },
        select: { id: true },
      });
      targetShopId = shop?.id || null;
    }

    if (!targetShopId) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 400 },
      );
    }

    const where: any = { shopId: targetShopId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { vendorOrderNumber: { contains: query, mode: 'insensitive' } },
        { masterOrder: { orderNumber: { contains: query, mode: 'insensitive' } } },
        { items: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    const vendorOrders = await prisma.vendorOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            id: true,
            shopCode: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            state: true,
            pincode: true,
            sellerProfile: { select: { gstin: true, legalName: true, businessAddress: true } },
          },
        },
        masterOrder: {
          select: {
            id: true,
            orderNumber: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            address: true,
            user: { select: { name: true, email: true, mobile: true } },
          },
        },
        shipments: {
          include: {
            items: true,
            pickupLocation: true,
            trackingEvents: { orderBy: { eventTimestamp: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        items: {
          include: {
            product: {
              select: { name: true, sku: true, images: { select: { imageUrl: true }, take: 1 } },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: vendorOrders,
    });
  } catch (error: any) {
    console.error('❌ GET Seller Orders Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load seller vendor orders.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/seller/orders
 * Action dispatcher for seller order fulfillment: PACK, GENERATE_AWB, GENERATE_LABEL, SCHEDULE_PICKUP, CANCEL.
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { vendorOrderId, shipmentId, action, status, shippingStatus, awbCode, courierName } =
      body;

    if (!vendorOrderId && !shipmentId) {
      return NextResponse.json(
        { success: false, message: 'vendorOrderId or shipmentId is required.' },
        { status: 400 },
      );
    }

    let shipment = shipmentId
      ? await prisma.shipment.findUnique({
          where: { id: shipmentId },
          include: { shop: true, masterOrder: { include: { shipments: true } } },
        })
      : await prisma.shipment.findFirst({
          where: { vendorOrderId },
          include: { shop: true, masterOrder: { include: { shipments: true } } },
        });

    const vendorOrder = vendorOrderId
      ? await prisma.vendorOrder.findUnique({
          where: { id: vendorOrderId },
          include: { shop: true },
        })
      : shipment?.vendorOrderId
        ? await prisma.vendorOrder.findUnique({
            where: { id: shipment.vendorOrderId },
            include: { shop: true },
          })
        : null;

    const shopOwnerId = shipment?.shop?.ownerId || vendorOrder?.shop?.ownerId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(currentUser.role);
    const isShopOwner = shopOwnerId === currentUser.id;

    if (!isShopOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You can only manage orders for your own store.' },
        { status: 403 },
      );
    }

    // 1. Action: GENERATE_AWB
    if (action === 'GENERATE_AWB' && shipment) {
      const res = await AwbService.generateAwbForShipment(shipment.id);
      return NextResponse.json(res, { status: res.statusCode || 200 });
    }

    // 2. Action: GENERATE_LABEL
    if (action === 'GENERATE_LABEL' && shipment) {
      const res = await LabelService.generateLabelForShipment(shipment.id);
      return NextResponse.json(res, { status: res.statusCode || 200 });
    }

    // 3. Action: SCHEDULE_PICKUP
    if (action === 'SCHEDULE_PICKUP' && shipment) {
      const res = await PickupService.schedulePickupForShipment(shipment.id);
      return NextResponse.json(res, { status: res.statusCode || 200 });
    }

    // 4. Action: CANCEL
    if (action === 'CANCEL' && shipment) {
      const res = await MultiSellerShipmentService.cancelShipment(shipment.id);
      return NextResponse.json({
        success: true,
        message: 'Shipment cancelled successfully and inventory restored.',
        data: res,
      });
    }

    // 5. Action: PACK / Manual Status Update
    if (shipment) {
      const newStatus = action === 'PACK' ? 'PACKED' : status || shipment.status;
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: newStatus,
          trackingStatus: newStatus,
          ...(awbCode ? { awbCode } : {}),
          ...(courierName ? { courierName } : {}),
        },
      });

      if (vendorOrder) {
        await prisma.vendorOrder.update({
          where: { id: vendorOrder.id },
          data: {
            status: newStatus === 'PACKED' ? 'PROCESSING' : (newStatus as any),
            shippingStatus: shippingStatus || (newStatus === 'PACKED' ? 'PROCESSING' : 'PENDING'),
            ...(awbCode ? { awbCode } : {}),
            ...(courierName ? { courierName } : {}),
          },
        });
      }

      // Recalculate master order status
      const allShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: newStatus } : s,
      );
      const masterStatus = StatusAggregatorService.calculateMasterOrderStatus(allShipments);

      await prisma.order.update({
        where: { id: shipment.masterOrderId },
        data: { orderStatus: masterStatus },
      });

      return NextResponse.json({
        success: true,
        message: `Shipment status updated to ${newStatus}.`,
        data: updatedShipment,
      });
    }

    return NextResponse.json({ success: true, message: 'Vendor order updated.' });
  } catch (error: any) {
    console.error('❌ PATCH Seller Order Status Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update vendor order status.' },
      { status: 500 },
    );
  }
}
