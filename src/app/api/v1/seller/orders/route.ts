import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/seller/orders
 * Returns Vendor Orders belonging to the authenticated seller's shop with status filtering and search.
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
            name: true,
            slug: true,
            logo: true,
            city: true,
            state: true,
            sellerProfile: { select: { gstin: true, legalName: true, businessAddress: true } },
          },
        },
        masterOrder: {
          select: {
            orderNumber: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
            address: true,
            user: { select: { name: true, email: true, mobile: true } },
          },
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
 * Allows seller to update status of their vendor order (e.g., PENDING -> PACKED -> SHIPPED -> DELIVERED).
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
    const { vendorOrderId, status, shippingStatus, awbCode, courierName } = body;

    if (!vendorOrderId) {
      return NextResponse.json(
        { success: false, message: 'Vendor Order ID is required.' },
        { status: 400 },
      );
    }

    const existing = await prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      include: { shop: { select: { ownerId: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Vendor Order not found.' },
        { status: 404 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(currentUser.role);
    const isShopOwner = existing.shop.ownerId === currentUser.id;

    if (!isShopOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You can only manage orders for your own store.' },
        { status: 403 },
      );
    }

    const updated = await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: {
        ...(status ? { status } : {}),
        ...(shippingStatus ? { shippingStatus } : {}),
        ...(awbCode ? { awbCode } : {}),
        ...(courierName ? { courierName } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Vendor order status updated to ${status || shippingStatus}.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('❌ PATCH Seller Order Status Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update vendor order status.' },
      { status: 500 },
    );
  }
}
