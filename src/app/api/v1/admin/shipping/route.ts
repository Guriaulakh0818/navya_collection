import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { getShiprocketMetrics } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/shipping
 * Returns all marketplace shipments, logistics statistics, and Shiprocket connection health.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const query = (searchParams.get('q') || '').trim();

    const where: any = {};

    if (shopId && shopId !== 'ALL') {
      where.shopId = shopId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (query) {
      where.OR = [
        { shipmentNumber: { contains: query, mode: 'insensitive' } },
        { awbCode: { contains: query, mode: 'insensitive' } },
        { masterOrder: { orderNumber: { contains: query, mode: 'insensitive' } } },
        { shop: { name: { contains: query, mode: 'insensitive' } } },
        { shop: { shopCode: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Query Shipments
    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        shop: {
          select: {
            id: true,
            shopCode: true,
            name: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        masterOrder: {
          select: {
            orderNumber: true,
            paymentStatus: true,
            paymentMethod: true,
            user: { select: { name: true, email: true, mobile: true } },
          },
        },
        pickupLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            city: true,
            pincode: true,
            shiprocketStatus: true,
          },
        },
        items: true,
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
          take: 5,
        },
      },
    });

    // Compute Logistics Statistics
    const totalShipments = await prisma.shipment.count();
    const inTransitCount = await prisma.shipment.count({
      where: { status: { in: ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PICKED_UP'] } },
    });
    const deliveredCount = await prisma.shipment.count({
      where: { status: 'DELIVERED' },
    });
    const rtoCount = await prisma.shipment.count({
      where: { status: { in: ['RTO_INITIATED', 'RTO_DELIVERED', 'RETURNED', 'CANCELLED'] } },
    });
    const totalPickupLocations = await prisma.pickupLocation.count();
    const connectedPickupLocations = await prisma.pickupLocation.count({
      where: { shiprocketStatus: 'CONNECTED' },
    });

    // Shiprocket API Connection Health
    const hasCredentials = Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
    const metrics = getShiprocketMetrics();

    return NextResponse.json({
      success: true,
      data: {
        shipments,
        stats: {
          totalShipments,
          inTransitCount,
          deliveredCount,
          rtoCount,
          totalPickupLocations,
          connectedPickupLocations,
        },
        shiprocketHealth: {
          isConfigured: hasCredentials,
          status: hasCredentials ? 'ACTIVE' : 'PENDING_CREDENTIALS',
          metrics,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Shipping Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load shipping data.' },
      { status: 500 },
    );
  }
}
