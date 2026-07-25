'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { OrderTracking } from '@/features/orders/components/OrderTracking';
import type { Order } from '@/features/orders/types/orders.types';

const ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-1001',
    date: '2026-07-20',
    status: 'Delivered',
    total: 1347,
    subtotal: 1298,
    shipping: 49,
    items: [
      { id: '1', productId: '1', name: 'Classic Navy Shirt', price: 899, quantity: 1 },
      { id: '2', productId: '2', name: 'Slim Fit Chinos', price: 449, quantity: 1 },
    ],
    address: {
      name: 'Test User',
      mobile: '9876543210',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    deliveryMethod: 'Standard Delivery',
    paymentMethod: 'Cash on Delivery',
    trackingEvents: [
      {
        id: 't1',
        title: 'Order Placed',
        description: 'Your order has been confirmed.',
        timestamp: '2026-07-20T10:00:00Z',
        status: 'completed',
      },
      {
        id: 't2',
        title: 'Packed',
        description: 'Your order has been packed.',
        timestamp: '2026-07-20T14:00:00Z',
        status: 'completed',
      },
      {
        id: 't3',
        title: 'Shipped',
        description: 'Your order is on the way.',
        timestamp: '2026-07-21T09:00:00Z',
        status: 'completed',
      },
      {
        id: 't4',
        title: 'Delivered',
        description: 'Your order has been delivered.',
        timestamp: '2026-07-23T11:00:00Z',
        status: 'completed',
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-1002',
    date: '2026-07-23',
    status: 'Shipped',
    total: 899,
    subtotal: 899,
    shipping: 0,
    items: [{ id: '3', productId: '3', name: 'Casual Polo T-Shirt', price: 899, quantity: 1 }],
    address: {
      name: 'Test User',
      mobile: '9876543210',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    deliveryMethod: 'Express Delivery',
    paymentMethod: 'Pay Online',
    trackingEvents: [
      {
        id: 't1',
        title: 'Order Placed',
        description: 'Your order has been confirmed.',
        timestamp: '2026-07-23T08:00:00Z',
        status: 'completed',
      },
      {
        id: 't2',
        title: 'Packed',
        description: 'Your order has been packed.',
        timestamp: '2026-07-23T12:00:00Z',
        status: 'completed',
      },
      {
        id: 't3',
        title: 'Shipped',
        description: 'Your order is on the way.',
        timestamp: '2026-07-24T09:00:00Z',
        status: 'active',
      },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-1003',
    date: '2026-07-24',
    status: 'Processing',
    total: 2199,
    subtotal: 2150,
    shipping: 49,
    items: [{ id: '4', productId: '4', name: 'Premium Linen Shirt', price: 1099, quantity: 2 }],
    address: {
      name: 'Test User',
      mobile: '9876543210',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    deliveryMethod: 'Standard Delivery',
    paymentMethod: 'Cash on Delivery',
    trackingEvents: [
      {
        id: 't1',
        title: 'Order Placed',
        description: 'Your order has been confirmed.',
        timestamp: '2026-07-24T15:00:00Z',
        status: 'active',
      },
    ],
  },
];

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // In a real app, you would fetch the order by ID from an API
  // For now, we'll find it from our mock data
  const orderId = params instanceof Promise ? null : '';

  if (orderId) {
    const foundOrder = ORDERS.find((o) => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
    setIsLoading(false);
  }

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOrder((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-sm text-slate-600">Loading order details...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="font-heading text-2xl text-navy mb-2">Order Not Found</p>
          <p className="text-sm text-slate-600 mb-6">
            The order you are looking for does not exist.
          </p>
          <Button className="rounded-full" asChild>
            <Link href="/account/orders">Back to Orders</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const canCancel = order.status === 'Processing' || order.status === 'Shipped';

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Orders', href: '/account/orders' },
          { label: order.orderNumber },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl text-navy">Order {order.orderNumber}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Placed on{' '}
              {new Date(order.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.status === 'Delivered'
                  ? 'bg-emerald-50 text-emerald-700'
                  : order.status === 'Cancelled'
                    ? 'bg-red-50 text-red-700'
                    : order.status === 'Shipped'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-amber-50 text-amber-700'
              }`}
            >
              {order.status}
            </span>
            {canCancel && (
              <Button
                variant="outline"
                className="rounded-full text-error hover:text-error"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
              <h3 className="font-heading text-xl text-navy mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50" />
                      <div>
                        <p className="text-sm font-semibold text-navy">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-navy">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
              <h3 className="font-heading text-xl text-navy mb-4">Delivery Address</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-semibold text-navy">{order.address.name}</p>
                <p>{order.address.mobile}</p>
                <p>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                </p>
                <p>
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            </div>

            {order.status !== 'Cancelled' && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
                <h3 className="font-heading text-xl text-navy mb-4">Track Order</h3>
                <OrderTracking events={order.trackingEvents} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
              <h3 className="font-heading text-xl text-navy mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-navy text-base">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
              <h3 className="font-heading text-xl text-navy mb-4">Shipping Info</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-navy">Delivery Method</p>
                  <p>{order.deliveryMethod}</p>
                </div>
                <div>
                  <p className="font-semibold text-navy">Payment Method</p>
                  <p>{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
