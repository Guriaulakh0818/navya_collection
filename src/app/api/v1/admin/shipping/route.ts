import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { getShiprocketMetrics } from '@/backend/lib/shiprocket';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/shipping
 * Returns all marketplace shipments, logistics statistics, and Shiprocket connection health.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAdminUser();
    if (
      !currentUser ||
      !['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(
        (currentUser.role || '').toUpperCase(),
      )
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
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);

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

    // Run Shipments, Shops, and all 6 Counts in parallel for sub-second performance
    const [
      shipments,
      shops,
      totalShipments,
      inTransitCount,
      deliveredCount,
      rtoCount,
      totalPickupLocations,
      connectedPickupLocations,
    ] = await Promise.all([
      prisma.shipment
        .findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
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
              take: 3,
            },
          },
        })
        .catch(() => []),

      prisma.shop
        .findMany({
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
        })
        .catch(() => []),

      prisma.shipment.count().catch(() => 0),
      prisma.shipment
        .count({
          where: { status: { in: ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PICKED_UP'] } },
        })
        .catch(() => 0),
      prisma.shipment
        .count({
          where: { status: 'DELIVERED' },
        })
        .catch(() => 0),
      prisma.shipment
        .count({
          where: { status: { in: ['RTO_INITIATED', 'RTO_DELIVERED', 'RETURNED', 'CANCELLED'] } },
        })
        .catch(() => 0),
      prisma.pickupLocation.count().catch(() => 0),
      prisma.pickupLocation
        .count({
          where: { shiprocketStatus: 'CONNECTED' },
        })
        .catch(() => 0),
    ]);

    // Enrich shipments with live shop details and primary pickup location
    const enrichedShipments = (shipments || []).map((shp: any) => {
      const activeShop = shp.shop;
      const primaryPickup =
        activeShop?.pickupLocations?.find((p: any) => p.isPrimary) ||
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
        createdAt: shp.createdAt ? new Date(shp.createdAt).toISOString() : new Date().toISOString(),
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

    // Shiprocket API Connection Health
    const hasCredentials = Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
    const metrics = getShiprocketMetrics();

    return NextResponse.json({
      success: true,
      data: {
        shipments: enrichedShipments,
        shops: shops || [],
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
      { success: false, message: error?.message || 'Failed to load shipping data.' },
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
    const currentUser = await getAdminUser();
    if (
      !currentUser ||
      !['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(
        (currentUser.role || '').toUpperCase(),
      )
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

    if (action === 'INITIATE_RTO' && body.shipmentId) {
      const { RtoService } = await import('@/backend/services/shipping/rto.service');
      const initiated = await RtoService.registerRtoInitiated({
        shipmentId: body.shipmentId,
        reason: body.reason,
        rtoShipmentId: body.rtoShipmentId,
      });
      return NextResponse.json({
        success: true,
        message: 'RTO initiated successfully.',
        data: initiated,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Unknown action specified.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('❌ POST Admin Shipping Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to execute shipping action.' },
      { status: 500 },
    );
  }
}
