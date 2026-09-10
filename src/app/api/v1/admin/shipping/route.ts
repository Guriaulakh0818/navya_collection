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
            fullAddress: true,
            city: true,
            state: true,
            pincode: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
              },
            },
            pickupLocations: {
              select: {
                id: true,
                locationCode: true,
                name: true,
                addressLine1: true,
                city: true,
                state: true,
                pincode: true,
                contactName: true,
                contactPhone: true,
                shiprocketStatus: true,
                isPrimary: true,
              },
            },
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
            addressLine1: true,
            city: true,
            state: true,
            pincode: true,
            contactName: true,
            contactPhone: true,
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

    // Enrich shipments with live shop details and primary pickup location to ensure updated address is always displayed
    const enrichedShipments = shipments.map((shp) => {
      const activeShop = shp.shop;
      const primaryPickup =
        activeShop?.pickupLocations?.find((p) => p.isPrimary) ||
        activeShop?.pickupLocations?.[0] ||
        shp.pickupLocation;

      const shopName = activeShop?.name || (shp.pickupAddressSnapshot as any)?.shopName || 'Shop';
      const shopCode = activeShop?.shopCode || (shp.pickupAddressSnapshot as any)?.shopCode || '';
      const addressLine1 =
        primaryPickup?.addressLine1 ||
        activeShop?.fullAddress ||
        (shp.pickupAddressSnapshot as any)?.addressLine1 ||
        '';
      const city =
        primaryPickup?.city || activeShop?.city || (shp.pickupAddressSnapshot as any)?.city || '';
      const state =
        primaryPickup?.state ||
        activeShop?.state ||
        (shp.pickupAddressSnapshot as any)?.state ||
        '';
      const pincode =
        primaryPickup?.pincode ||
        activeShop?.pincode ||
        (shp.pickupAddressSnapshot as any)?.pincode ||
        '';
      const contactName =
        primaryPickup?.contactName ||
        activeShop?.owner?.name ||
        (shp.pickupAddressSnapshot as any)?.contactName ||
        '';
      const contactPhone =
        primaryPickup?.contactPhone ||
        activeShop?.owner?.mobile ||
        (shp.pickupAddressSnapshot as any)?.contactPhone ||
        '';

      return {
        ...shp,
        shop: activeShop
          ? {
              ...activeShop,
              shopCode,
              name: shopName,
              fullAddress: addressLine1,
              city,
              state,
              pincode,
            }
          : null,
        pickupAddressSnapshot: {
          ...(typeof shp.pickupAddressSnapshot === 'object' && shp.pickupAddressSnapshot !== null
            ? shp.pickupAddressSnapshot
            : {}),
          shopName,
          shopCode,
          addressLine1,
          city,
          state,
          pincode,
          contactName,
          contactPhone,
        },
      };
    });

    // Fetch all active shops with their pickup locations
    const shops = await prisma.shop.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        shopCode: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        fullAddress: true,
        city: true,
        state: true,
        pincode: true,
        bankAccountHolder: true,
        shiprocketPickupName: true,
        status: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
        sellerProfile: {
          select: {
            businessName: true,
            legalName: true,
          },
        },
        pickupLocations: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            addressLine1: true,
            city: true,
            state: true,
            pincode: true,
            contactName: true,
            contactPhone: true,
            contactEmail: true,
            shiprocketPickupName: true,
            shiprocketStatus: true,
            shiprocketResponse: true,
            isPrimary: true,
            updatedAt: true,
          },
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
        shipments: enrichedShipments,
        shops,
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

/**
 * POST /api/v1/admin/shipping
 * Supports administrative actions like syncing all shop pickup locations to Shiprocket.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { action, pickupLocationId, shopId } = body;

    const { PickupLocationService } =
      await import('@/backend/services/shipping/pickup-location.service');

    if (action === 'SYNC_ALL_PICKUP_LOCATIONS') {
      const syncResult = await PickupLocationService.syncAllShopPickupLocations();
      return NextResponse.json({
        success: syncResult.success,
        message: syncResult.success
          ? `Successfully synced all ${syncResult.synced} shop pickup locations to Shiprocket!`
          : `Synced ${syncResult.synced} of ${syncResult.totalShops} pickup locations. Some failed.`,
        data: syncResult,
      });
    }

    if (action === 'PUSH_SHOP_PICKUP_LOCATION' && shopId) {
      const singleSync = await PickupLocationService.syncShopPickupLocation(shopId);
      return NextResponse.json({
        success: singleSync.success,
        message: singleSync.message,
        data: singleSync,
      });
    }

    if (action === 'REGISTER_PICKUP_LOCATION' && pickupLocationId) {
      const regResult = await PickupLocationService.registerWithShiprocket(pickupLocationId);
      return NextResponse.json(regResult);
    }

    if (action === 'DISPATCH_SHIPMENT' && body.shipmentId) {
      const { MultiSellerShipmentService } =
        await import('@/backend/services/shipping/multi-seller-shipment.service');
      const dispatchResult = await MultiSellerShipmentService.dispatchShipmentToShiprocket(
        body.shipmentId,
      );
      return NextResponse.json(dispatchResult);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action provided.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('❌ POST Admin Shipping Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to execute shipping action.' },
      { status: 500 },
    );
  }
}
