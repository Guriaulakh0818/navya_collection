'use client';

import { ArrowRight } from 'lucide-react';
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
  const { step, setStep } = useCheckout();

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
      <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 py-4 sm:py-8 w-full max-w-full overflow-x-hidden">
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
                  <button
                    type="button"
                    disabled={!isCompleted}
                    onClick={() => {
                      if (isCompleted) setStep(item.key as any);
                    }}
                    className={`flex flex-col items-center bg-transparent border-none p-0 text-left ${
                      isCompleted ? 'cursor-pointer group hover:opacity-85' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-navy text-white ring-2 ring-navy/20 ring-offset-2'
                          : isCompleted
                            ? 'bg-emerald-500 text-white group-hover:scale-105'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <span
                      className={`mt-1 text-xs font-medium ${
                        isActive
                          ? 'text-navy font-bold'
                          : isCompleted
                            ? 'text-slate-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
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

        {(() => {
          const isFullWidthStep = step === 'address' || step === 'payment' || step === 'review';

          return (
            <div
              className={
                isFullWidthStep
                  ? step === 'review'
                    ? 'max-w-4xl mx-auto w-full min-w-0'
                    : 'max-w-3xl mx-auto w-full min-w-0'
                  : 'grid gap-6 sm:gap-8 lg:grid-cols-3 w-full min-w-0'
              }
            >
              <div className={isFullWidthStep ? 'w-full min-w-0' : 'lg:col-span-2 min-w-0 w-full'}>
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

              {!isFullWidthStep && (
                <div className="rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-premium h-fit space-y-4 min-w-0 w-full">
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-navy">
                    Order Summary
                  </h3>
                  <OrderSummary />
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function OrderSummary() {
  const {
    step,
    items,
    deliveryMethod,
    paymentMethod,
    appliedCoupon,
    setAppliedCoupon,
    shippingData,
    isShippingLoading,
    taxData,
    isTaxLoading,
    nextStep,
  } = useCheckout();

  const availableItems = items.filter((item) => item.isAvailable !== false);
  const unavailableItems = items.filter((item) => item.isAvailable === false);
  const hasUnavailable = unavailableItems.length > 0;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  // Dynamic Shipping & Tax Calculations
  const shippingCharge =
    deliveryMethod?.price !== undefined
      ? deliveryMethod.price
      : shippingData
        ? shippingData.shippingCharge
        : items.length === 0
          ? 0
          : 49;

  // Validate that server taxData matches current subtotal to prevent stale calculations
  const isTaxDataValid = taxData && taxData.subtotal === subtotal;

  const taxRate = isTaxDataValid ? (taxData.taxBreakdown?.gst ?? 0) : 0;
  const taxAmount = isTaxDataValid ? (taxData.tax ?? 0) : 0;

  const isCod = paymentMethod?.id?.toLowerCase() === 'cod';
  const codFeeBase = isCod ? Math.max(0, netSubtotal + shippingCharge + taxAmount) : 0;
  const codFee = isCod ? Math.round(codFeeBase * 0.015 * 100) / 100 : 0;

  const grandTotal = isTaxDataValid
    ? Math.round((netSubtotal + shippingCharge + taxData.tax + codFee) * 100) / 100
    : Math.round((netSubtotal + shippingCharge + codFee) * 100) / 100;

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
          <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <span>Promo ({appliedCoupon.code})</span>
              <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded-full">
                APPLIED
              </span>
            </span>
            <span className="font-mono text-emerald-700">
              - ₹{discountAmount.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            Shipping
            {shippingData?.isFirstOrderFreeDelivery && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                ⭐ First Order
              </span>
            )}
          </span>
          <span className={shippingCharge === 0 ? 'font-bold text-emerald-600' : ''}>
            {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
          </span>
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

        {isCod && codFee > 0 && (
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              COD Handling Fee (1.5%)
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange/10 text-orange border border-orange/20">
                Non-refundable
              </span>
            </span>
            <span className="font-bold text-navy">
              ₹{codFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

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

      {/* Coupon Input Integration - Only shown in Step 1 (Cart Review) */}
      {step === 'cart' && (
        <div className="border-t border-border pt-4">
          <CouponInputCard
            cartAmount={subtotal}
            appliedCoupon={appliedCoupon}
            onApplySuccess={(coupon) => setAppliedCoupon(coupon)}
            onRemoveCoupon={() => setAppliedCoupon(null)}
          />
        </div>
      )}

      {/* Primary Action Button - Proceed to Address (Step 1 Cart Review) */}
      {step === 'cart' && (
        <div className="pt-2">
          <Button
            type="button"
            onClick={nextStep}
            disabled={availableItems.length === 0}
            className={`w-full rounded-full font-extrabold text-xs sm:text-sm px-6 h-11 sm:h-12 transition-all flex items-center justify-center gap-2 ${
              availableItems.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-orange hover:bg-orange-hover text-white shadow-md shadow-orange/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
            }`}
          >
            <span>
              {availableItems.length === 0
                ? 'No Available Items in Cart'
                : hasUnavailable
                  ? 'Continue with Available Items'
                  : 'Continue to Address'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
