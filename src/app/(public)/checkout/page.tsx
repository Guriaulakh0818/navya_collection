'use client';

import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { AddressStep } from '@/features/checkout/components/address-step';
import { CartReviewStep } from '@/features/checkout/components/cart-review-step';
import { DeliveryStep } from '@/features/checkout/components/delivery-step';
import { PaymentStep } from '@/features/checkout/components/payment-step';
import { ReviewStep } from '@/features/checkout/components/review-step';
import { CheckoutProvider, useCheckout } from '@/features/checkout/context/checkout-context';
import { useCartStore } from '@/stores';

const STEP_LABELS = [
  { key: 'cart', label: 'Cart' },
  { key: 'address', label: 'Address' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

function CheckoutSteps() {
  const { step, prevStep } = useCheckout();

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="font-heading text-3xl text-navy mb-6">Checkout</h1>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((item, index) => {
              const isActive = step === item.key;
              const isCompleted = STEP_LABELS.findIndex((s) => s.key === step) > index;
              return (
                <div key={item.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive
                          ? 'bg-navy text-white'
                          : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span
                      className={`mt-1 text-xs font-medium ${
                        isActive ? 'text-navy' : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < STEP_LABELS.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 'cart' && <CartReviewStep />}
            {step === 'address' && <AddressStep />}
            {step === 'delivery' && <DeliveryStep />}
            {step === 'payment' && <PaymentStep />}
            {step === 'review' && (
              <ReviewStep
                onPlaceOrder={() => {
                  window.location.href = '/checkout/success';
                }}
              />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
            <h3 className="font-heading text-xl text-navy mb-4">Order Summary</h3>
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary() {
  const { items } = useCheckout();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + (subtotal > 999 ? 0 : shipping);

  return (
    <div className="space-y-3 text-sm text-slate-600">
      <div className="flex justify-between">
        <span>Subtotal ({items.length} items)</span>
        <span>₹{subtotal.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
      </div>
      {shipping > 0 && (
        <p className="text-xs text-slate-500">
          Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
        </p>
      )}
      <div className="border-t border-border pt-3 flex justify-between font-semibold text-navy text-base">
        <span>Total</span>
        <span>₹{total.toLocaleString('en-IN')}</span>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-slate-500 mt-2">
          Your cart is empty.{' '}
          <Link href="/shop" className="text-navy underline">
            Continue shopping
          </Link>
        </p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);

  return (
    <ProtectedRoute>
      {items.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-20 text-center">
          <h1 className="font-heading text-3xl text-navy">Your Cart is Empty</h1>
          <p className="mt-2 text-sm text-slate-600">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <CheckoutProvider>
          <CheckoutSteps />
        </CheckoutProvider>
      )}
    </ProtectedRoute>
  );
}
