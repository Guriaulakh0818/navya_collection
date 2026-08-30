'use client';

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    async function fetchOrderDetail() {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error('Failed to fetch order detail:', err);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetail();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;
    setIsCancelling(true);
    try {
      // If shipments exist, cancel each shipment
      if (order.shipments && order.shipments.length > 0) {
        for (const shp of order.shipments) {
          await fetch('/api/v1/seller/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipmentId: shp.id, action: 'CANCEL' }),
          });
        }
      }
      setOrder((prev: any) => (prev ? { ...prev, status: 'Cancelled' } : null));
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading order details...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-heading text-2xl text-navy mb-2">Order Not Found</p>
          <p className="text-sm text-slate-600 mb-6">
            The order you are looking for does not exist or has been removed.
          </p>
          <Button
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            asChild
          >
            <Link href="/account/orders">Back to My Orders</Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const canCancel = order.status === 'Processing' || order.status === 'PENDING';
  const hasMultipleShipments = order.shipments && order.shipments.length > 1;

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
        {/* Top Order Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-navy">
                Order {order.orderNumber}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  order.status === 'Delivered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : order.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-700 border border-rose-300'
                      : order.status === 'Shipped'
                        ? 'bg-sky-50 text-sky-700 border border-sky-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Placed on{' '}
              {new Date(order.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCancel && (
              <Button
                variant="outline"
                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
          </div>
        </div>

        {/* Multi-Seller Shipments Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              {hasMultipleShipments
                ? `Order Shipments (${order.shipments.length} Packages from Multiple Boutiques)`
                : 'Shipment & Delivery Details'}
            </h2>
          </div>

          {order.shipments && order.shipments.length > 0 ? (
            order.shipments.map((shipment: any, idx: number) => (
              <div
                key={shipment.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
              >
                {/* Shipment Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-800 text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-navy text-sm">
                          {shipment.shipmentNumber}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400">•</span>
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {shipment.shopName} ({shipment.pickupCity})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Courier: <strong className="text-slate-700">{shipment.courierName}</strong>
                        {shipment.awbCode && ` | AWB: ${shipment.awbCode}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        shipment.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : shipment.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : shipment.status === 'IN_TRANSIT' || shipment.status === 'SHIPPED'
                              ? 'bg-sky-50 text-sky-700 border border-sky-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {shipment.status}
                    </span>
                    {shipment.awbCode && (
                      <a
                        href={
                          shipment.trackingUrl ||
                          `https://shiprocket.co/tracking/${shipment.awbCode}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Track
                      </a>
                    )}
                  </div>
                </div>

                {/* Shipment Items List */}
                <div className="divide-y divide-slate-100">
                  {(shipment.items || []).map((item: any) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy">{item.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            SKU: {item.sku} {item.size && `• Size: ${item.size}`}{' '}
                            {item.color && `• Color: ${item.color}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-navy">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipment Progress Bar */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      { key: 'CONFIRMED', label: 'Confirmed', done: true },
                      {
                        key: 'PACKED',
                        label: 'Packed',
                        done: [
                          'PACKED',
                          'READY_TO_SHIP',
                          'PICKUP_SCHEDULED',
                          'IN_TRANSIT',
                          'SHIPPED',
                          'DELIVERED',
                        ].includes(shipment.status),
                      },
                      {
                        key: 'IN_TRANSIT',
                        label: 'In Transit',
                        done: ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                          shipment.status,
                        ),
                      },
                      {
                        key: 'DELIVERED',
                        label: 'Delivered',
                        done: shipment.status === 'DELIVERED',
                      },
                    ].map((step, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div
                          className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center font-bold text-[10px] ${
                            step.done
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {step.done ? '✓' : sIdx + 1}
                        </div>
                        <p
                          className={`text-[11px] font-bold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-heading text-lg text-navy mb-4">Order Items</h3>
              <div className="divide-y divide-slate-100">
                {order.items.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-slate-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy">{item.name}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-navy">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delivery & Summary Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Delivery Address */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-heading text-base font-bold text-navy flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              Customer Delivery Address
            </h3>
            {order.address && (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-navy text-sm">{order.address.name}</p>
                <p>{order.address.mobile}</p>
                <p>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}
                </p>
                <p>
                  {order.address.city}, {order.address.state} -{' '}
                  <strong>{order.address.pincode}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Payment & Order Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-heading text-base font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Payment & Order Summary
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <strong className="text-navy">{order.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-navy text-sm">
                <span>Grand Total</span>
                <span className="text-amber-800">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
