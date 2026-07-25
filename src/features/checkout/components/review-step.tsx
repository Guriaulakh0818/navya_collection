'use client';

import { CheckCircle2, CreditCard, MapPin, Truck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import { formatPrice } from '@/utils/format-price';

export function ReviewStep({ onPlaceOrder }: { onPlaceOrder: () => void }) {
  const { items, address, deliveryMethod, paymentMethod } = useCheckout();
  const [isPlacing, setIsPlacing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = deliveryMethod?.price || 0;
  const total = subtotal + (subtotal > 999 && shipping === 0 ? 0 : shipping);

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      onPlaceOrder();
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h2 className="font-heading text-xl text-navy mb-6">Review Your Order</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Delivery Address
          </h3>
          {address ? (
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <MapPin className="h-5 w-5 text-navy mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy">
                  {address.label} {address.isDefault ? '(Default)' : ''}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {address.name} | {address.mobile}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {address.line1}, {address.line2 ? `${address.line2}, ` : ''}
                  {address.city}, {address.state} - {address.pincode}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No address selected</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Delivery Method
          </h3>
          {deliveryMethod ? (
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <Truck className="h-5 w-5 text-navy mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy">{deliveryMethod.name}</p>
                <p className="text-sm text-slate-600 mt-1">{deliveryMethod.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Estimated: {deliveryMethod.estimatedDays} |{' '}
                  {deliveryMethod.price === 0 ? 'Free' : `₹${deliveryMethod.price}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No delivery method selected</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Payment Method
          </h3>
          {paymentMethod ? (
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <CreditCard className="h-5 w-5 text-navy mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy">{paymentMethod.name}</p>
                <p className="text-sm text-slate-600 mt-1">{paymentMethod.description}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No payment method selected</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Order Items
          </h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-sky-50 to-orange-50" />
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600 border-t border-border pt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold text-navy text-base pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="rounded-full">
          Back
        </Button>
        <Button className="rounded-full" onClick={handlePlaceOrder} disabled={isPlacing}>
          {isPlacing ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
}
