import { NextResponse } from 'next/server';

import { OrderRepository } from '@/features/orders/repositories/order.repository';
import { ensureUserExists } from '@/lib/ensure-user';
import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/orders
 *
 * Fetches all orders placed by the current authenticated or active user from Supabase DB.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to view order history.' },
        { status: 401 },
      );
    }

    const userId = await ensureUserExists(user.id);
    const dbOrders = await OrderRepository.findManyByUserId(userId);

    const formattedOrders = dbOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString(),
      status:
        o.orderStatus === 'CONFIRMED'
          ? 'Processing'
          : o.orderStatus === 'DELIVERED'
            ? 'Delivered'
            : o.orderStatus === 'SHIPPED'
              ? 'Shipped'
              : o.orderStatus === 'CANCELLED'
                ? 'Cancelled'
                : 'Processing',
      total: Number(o.finalAmount),
      subtotal: Number(o.totalAmount),
      shipping: Number(o.shippingAmount),
      paymentMethod: o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay)',
      paymentStatus: o.paymentStatus,
      items: o.items.map((item) => ({
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
      address: o.address
        ? {
            name: o.address.fullName,
            mobile: o.address.mobile,
            line1: o.address.addressLine1,
            line2: o.address.addressLine2,
            city: o.address.city,
            state: o.address.state,
            pincode: o.address.pincode,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error('[GET_ORDERS_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user orders.' },
      { status: 500 },
    );
  }
}
