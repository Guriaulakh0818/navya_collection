import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { OrderRepository } from '@/features/orders/repositories/order.repository';

/**
 * GET /api/v1/orders/[id]
 *
 * Fetches order details by Order ID or Order Number with strict authorization.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const idOrNumber = params.id;
    if (!idOrNumber) {
      return NextResponse.json(
        { success: false, message: 'Order ID or Number is required.' },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to view order details.' },
        { status: 401 },
      );
    }

    const order = await OrderRepository.findByIdOrNumber(idOrNumber);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    // Authorization Check: Allow if user is order owner OR is an Admin/Seller
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(currentUser.role);
    const isSeller = currentUser.role === 'SELLER';
    const isOwner = order.userId === currentUser.id;

    if (!isOwner && !isAdmin && !isSeller) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You do not have permission to view this order.' },
        { status: 403 },
      );
    }

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      status:
        order.orderStatus === 'CONFIRMED'
          ? 'Processing'
          : order.orderStatus === 'DELIVERED'
            ? 'Delivered'
            : order.orderStatus === 'SHIPPED'
              ? 'Shipped'
              : order.orderStatus === 'CANCELLED'
                ? 'Cancelled'
                : 'Processing',
      total: Number(order.finalAmount),
      subtotal: Number(order.totalAmount),
      shipping: Number(order.shippingAmount),
      paymentMethod:
        order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay)',
      paymentStatus: order.paymentStatus,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        total: Number(item.total),
        image:
          item.product?.images?.[0]?.imageUrl ||
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      })),
      address: order.address
        ? {
            name: order.address.fullName,
            mobile: order.address.mobile,
            line1: order.address.addressLine1,
            line2: order.address.addressLine2,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
          }
        : null,
      shipments: (order.shipments || []).map((shp: any) => ({
        id: shp.id,
        shipmentNumber: shp.shipmentNumber,
        shopName: shp.shop?.name || 'Navya Boutique',
        shopCode: shp.shop?.shopCode || null,
        status: shp.status,
        trackingStatus: shp.trackingStatus,
        courierName: shp.courierName || 'Standard Courier',
        awbCode: shp.awbCode || null,
        trackingUrl: shp.awbCode ? `https://shiprocket.co/tracking/${shp.awbCode}` : null,
        pickupCity: (shp.pickupAddressSnapshot as any)?.city || shp.shop?.city || 'Jaipur Hub',
        itemCount: shp.itemCount,
        items: (shp.items || []).map((itm: any) => ({
          id: itm.id,
          name: itm.name,
          sku: itm.sku,
          size: itm.size,
          color: itm.color,
          price: Number(itm.price),
          quantity: itm.quantity,
          total: Number(itm.total),
        })),
        trackingEvents: (shp.trackingEvents || []).map((te: any) => ({
          id: te.id,
          status: te.status,
          activity: te.activity,
          location: te.location,
          timestamp: te.eventTimestamp.toISOString(),
        })),
      })),
      trackingEvents: [
        {
          id: 't1',
          title: 'Order Placed',
          description: 'Your order has been placed and confirmed successfully.',
          timestamp: order.createdAt.toISOString(),
          status: 'completed',
        },
        {
          id: 't2',
          title: 'Processing',
          description: 'Our warehouse team is preparing your items.',
          timestamp: order.createdAt.toISOString(),
          status: 'active',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error: any) {
    console.error('[GET_ORDER_DETAIL_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order details.' },
      { status: 500 },
    );
  }
}
