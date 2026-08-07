import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/orders
 * Fetches all real marketplace orders from Prisma DB for Admin Fulfillment & Governance.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'ALL';

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

    const [totalOrders, ordersList, totalRevenueAgg] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    const formattedOrders = ordersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || o.address?.fullName || 'Customer',
      customerEmail: o.user?.email || 'N/A',
      customerPhone: o.address?.mobile || o.user?.mobile || 'N/A',
      itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
      shopNames: Array.from(new Set(o.items.map((i) => i.shop?.name).filter(Boolean))),
      totalAmount: Number(o.totalAmount || 0),
      discountAmount: Number(o.discountAmount || 0),
      shippingAmount: Number(o.shippingAmount || 0),
      finalAmount: Number(o.finalAmount || o.totalAmount || 0),
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'COD',
      createdAt: o.createdAt.toISOString(),
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
      items: o.items.map((item) => ({
        id: item.id,
        name: item.name || item.product?.name || 'Product',
        price: Number(item.price || 0),
        quantity: item.quantity,
        shopName: item.shop?.name || 'Navya Boutique',
        imageUrl: item.product?.images[0]?.imageUrl || undefined,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue: Number(totalRevenueAgg._sum.totalAmount || 0),
        },
        orders: formattedOrders,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Orders Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders.' },
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
    const admin = await getCurrentUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { orderId, orderStatus, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.orderNumber} updated successfully.`,
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error('❌ PATCH Admin Order Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order.' },
      { status: 500 },
    );
  }
}
