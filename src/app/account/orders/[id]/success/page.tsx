import { CheckCircle2, MapPin, Package, ShoppingBag, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { OrderRepository } from '@/features/orders/repositories/order.repository';

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  const order = await OrderRepository.findByIdOrNumber(params.id);

  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Orders', href: '/account/orders' },
          { label: 'Order Success' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />

      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8 space-y-6">
        {/* Celebration Header Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs mb-1">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-navy">Order Confirmed & Placed!</h1>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto leading-relaxed">
            Thank you for shopping with <strong className="text-navy">Navya Collection</strong>. We
            have received your order and sent a confirmation to your registered phone number.
          </p>

          <div className="inline-flex items-center gap-3 pt-2">
            <span className="text-xs font-bold text-navy bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              Order #:{' '}
              <strong className="text-navy font-extrabold">
                {order?.orderNumber || params.id}
              </strong>
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-full border border-emerald-200">
              Status: {order?.orderStatus || 'CONFIRMED'}
            </span>
          </div>
        </div>

        {/* Order Details & Summary Box */}
        {order ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-6">
            {/* Delivery Address & Method */}
            <div className="grid gap-4 md:grid-cols-2 pb-6 border-b border-slate-100">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-navy" /> Delivery Address
                </span>
                <p className="font-bold text-navy text-sm">{order.address?.fullName}</p>
                <p className="text-xs text-slate-600">📱 {order.address?.mobile}</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {order.address?.addressLine1}
                  {order.address?.addressLine2 ? `, ${order.address?.addressLine2}` : ''}
                  <br />
                  {order.address?.city}, {order.address?.state} — {order.address?.pincode}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-navy" /> Payment Info
                </span>
                <p className="text-xs font-bold text-navy">
                  Payment Method:{' '}
                  <span className="font-extrabold uppercase text-navy">{order.paymentMethod}</span>
                </p>
                <p className="text-xs font-bold text-slate-600">
                  Payment Status:{' '}
                  <span
                    className={
                      order.paymentStatus === 'PAID'
                        ? 'text-emerald-600 font-extrabold'
                        : 'text-amber-600 font-extrabold'
                    }
                  >
                    {order.paymentStatus}
                  </span>
                </p>
                {order.razorpayPaymentId && (
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    Txn ID: {order.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-navy" /> Items in Order ({order.items.length})
              </h3>

              <div className="space-y-2.5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 bg-white"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <Image
                          src={
                            item.product?.images?.[0]?.imageUrl ||
                            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'
                          }
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-navy">{item.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <span className="font-bold text-navy text-sm">
                      ₹{Number(item.total).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="pt-4 border-t border-slate-100 flex flex-col items-end space-y-1.5">
              <div className="w-full max-w-xs space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-navy">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>
                    {Number(order.shippingAmount) === 0
                      ? 'FREE'
                      : `₹${Number(order.shippingAmount)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-base text-navy">
                    ₹{Number(order.finalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href={`/account/orders`}>
            <Button variant="outline" className="rounded-full text-xs font-semibold px-6">
              View All My Orders
            </Button>
          </Link>

          <Link href="/shop">
            <button className="rounded-full bg-navy text-white hover:bg-navy/90 font-bold text-xs px-6 py-2.5 shadow-md transition cursor-pointer flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
