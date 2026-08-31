'use client';

import { useEffect } from 'react';
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
import { CouponInputCard } from '@/features/coupons/components/CouponInputCard';
import { ShippingSummaryCard } from '@/features/shipping/components/ShippingSummaryCard';
import { useCartStore } from '@/stores';

const STEP_LABELS = [
  { key: 'cart', label: 'Cart' },
  { key: 'address', label: 'Address' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
];

function CheckoutSteps() {
  const { step } = useCheckout();

  useEffect(() => {
    try {
      useCartStore.getState().mergeGuestCart();
    } catch {}
  }, []);

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
      <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 py-4 sm:py-8">
        <h1 className="font-heading text-2xl sm:text-3xl text-navy mb-4 sm:mb-6">Checkout</h1>

        {/* Mobile Compact Step Progress (< md) */}
        <div className="md:hidden bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-orange font-extrabold uppercase tracking-wider">
              Step {STEP_LABELS.findIndex((s) => s.key === step) + 1} of 5
            </span>
            <span className="text-navy font-black text-sm">
              {STEP_LABELS.find((s) => s.key === step)?.label}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-orange h-full transition-all duration-500 rounded-full"
              style={{
                width: `${((STEP_LABELS.findIndex((s) => s.key === step) + 1) / 5) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Desktop Step Indicator (>= md) */}
        <div className="hidden md:block mb-8">
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

          <div className="rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-premium h-fit space-y-4">
            <h3 className="font-heading text-lg sm:text-xl font-bold text-navy">Order Summary</h3>
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummary() {
  const {
    items,
    deliveryMethod,
    appliedCoupon,
    setAppliedCoupon,
    shippingData,
    isShippingLoading,
    taxData,
    isTaxLoading,
  } = useCheckout();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  // Dynamic Shipping & Tax Calculations
  const shippingCharge = shippingData
    ? shippingData.shippingCharge
    : netSubtotal >= 999 || netSubtotal === 0
      ? 0
      : 99;

  // Validate that server taxData matches current subtotal to prevent stale calculations
  const isTaxDataValid = taxData && taxData.subtotal === subtotal;

  const taxRate = isTaxDataValid ? taxData.taxBreakdown.gst : 18;
  const taxAmount = isTaxDataValid
    ? taxData.tax
    : Math.round(((netSubtotal * taxRate) / 100) * 100) / 100;

  const grandTotal = isTaxDataValid
    ? taxData.grandTotal
    : Math.round((netSubtotal + shippingCharge + taxAmount) * 100) / 100;

  return (
    <div className="space-y-4 text-sm text-slate-600">
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <span>
            Subtotal ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
          </span>
          <span>₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Discount ({appliedCoupon.code})</span>
            <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            GST ({taxRate}%)
            {taxData?.taxBreakdown?.taxType && (
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-navy border border-slate-200">
                {taxData.taxBreakdown.taxType === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'}
              </span>
            )}
          </span>
          <span className="font-bold text-navy">
            ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t border-border pt-3 flex justify-between font-semibold text-navy text-base">
          <span>Grand Total</span>
          <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Shipping Calculation Summary Card */}
      <div className="border-t border-border pt-4">
        <ShippingSummaryCard
          shippingData={shippingData}
          deliveryMethod={deliveryMethod}
          subtotal={subtotal}
          isLoading={isShippingLoading || isTaxLoading}
        />
      </div>

      {/* Coupon Input Integration */}
      <div className="border-t border-border pt-4">
        <CouponInputCard
          cartAmount={subtotal}
          appliedCoupon={appliedCoupon}
          onApplySuccess={(coupon) => setAppliedCoupon(coupon)}
          onRemoveCoupon={() => setAppliedCoupon(null)}
        />
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
