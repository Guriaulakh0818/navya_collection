import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { OrderEmailNotificationService } from '@/backend/services/order-email.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/orders
 * Fetches all real marketplace orders from Prisma DB for Admin Fulfillment & Governance.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const statusFilter = searchParams.get('status') || 'ALL';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusFilter !== 'ALL') {
      where.orderStatus = statusFilter;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { address: { fullName: { contains: search, mode: 'insensitive' } } },
        { address: { mobile: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 1. Fetch aggregate metrics (count and revenue in one consistent query)
    const [orderStats, directCount] = await Promise.all([
      prisma.order
        .aggregate({
          where,
          _count: { id: true },
          _sum: { totalAmount: true },
        })
        .catch((err) => {
          console.warn('⚠️ Order aggregate failed:', err?.message);
          return { _count: { id: 0 }, _sum: { totalAmount: 0 } };
        }),
      prisma.order.count({ where }).catch(() => 0),
    ]);

    // 2. Fetch orders with multi-stage relation fallback
    let ordersList: any[] = [];
    try {
      ordersList = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, mobile: true } },
          address: true,
          items: {
            include: {
              shop: { select: { id: true, name: true, slug: true } },
              product: { select: { name: true, images: { take: 1 } } },
            },
          },
        },
      });
    } catch (err: any) {
      console.warn(
        '⚠️ Full order include failed, attempting fallback with basic items include:',
        err?.message,
      );
      try {
        ordersList = await prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true, mobile: true } },
            address: true,
            items: {
              include: {
                shop: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        });
      } catch (fallbackErr: any) {
        console.warn(
          '⚠️ Secondary order include failed, attempting basic items fetch:',
          fallbackErr?.message,
        );
        try {
          ordersList = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              user: { select: { id: true, name: true, email: true, mobile: true } },
              address: true,
              items: true,
            },
          });
        } catch {
          ordersList = await prisma.order
            .findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
            })
            .catch(() => []);
        }
      }
    }

    const totalOrders = Math.max(
      Number(orderStats?._count?.id || directCount || 0),
      ordersList.length,
    );
    const totalRevenueAgg = orderStats;

    const formattedOrders = (ordersList || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || o.address?.fullName || 'Customer',
      customerEmail: o.user?.email || 'N/A',
      customerPhone: o.address?.mobile || o.user?.mobile || 'N/A',
      itemCount: (o.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0),
      shopNames: Array.from(new Set((o.items || []).map((i: any) => i.shop?.name).filter(Boolean))),
      totalAmount: Number(o.totalAmount || 0),
      discountAmount: Number(o.discountAmount || 0),
      shippingAmount: Number(o.shippingAmount || 0),
      finalAmount: Number(o.finalAmount || o.totalAmount || 0),
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'COD',
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      address: o.address
        ? {
            fullName: o.address.fullName,
            mobile: o.address.mobile,
            fullAddress: o.address.addressLine1,
            city: o.address.city,
            state: o.address.state,
            pincode: o.address.pincode,
          }
        : null,
      items: (o.items || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.product?.name || 'Product',
        price: Number(item.price || 0),
        quantity: item.quantity,
        shopName: item.shop?.name || 'Navya Boutique',
        imageUrl: item.product?.images?.[0]?.imageUrl || undefined,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalOrders: Number(totalOrders || 0),
          totalRevenue: Number(totalRevenueAgg?._sum?.totalAmount || 0),
        },
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Orders Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch orders.' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v1/admin/orders
 * Updates status of an order.
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, orderStatus, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (orderStatus) {
      updateData.orderStatus = orderStatus;
      if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(orderStatus)) {
        updateData.shippingStatus = orderStatus;
      } else if (orderStatus === 'PROCESSING') {
        updateData.shippingStatus = 'PACKED';
      }
    }
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Trigger customer email notification on status change asynchronously
    try {
      if (orderStatus) {
        OrderEmailNotificationService.notifyOrderStatusChanged(orderId, orderStatus).catch(
          () => {},
        );
      }
    } catch {
      // Non-blocking notification failure
    }

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.orderNumber} updated successfully.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('❌ PATCH Admin Orders Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update order.' },
      { status: 500 },
    );
  }
}
