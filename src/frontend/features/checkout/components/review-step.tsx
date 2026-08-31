'use client';

import { AlertTriangle, CreditCard, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import { loadRazorpayScript } from '@/lib/load-razorpay-script';
import { useCartStore } from '@/stores';

export interface OrderPreviewData {
  customer: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
  address: {
    id: string;
    fullName: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    type?: string;
  } | null;
  items: {
    id: string;
    productId: string;
    variantId?: string | null;
    name: string;
    productName: string;
    productSlug: string;
    variantName?: string | null;
    size?: string | null;
    color?: string | null;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    quantity: number;
    availableStock: number;
    inStock: boolean;
    image?: string;
    subtotal: number;
  }[];
  itemCount?: number;
  subtotal: number;
  discount: number;
  netSubtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  totalSavings: number;
  estimatedDelivery: string;
  isServiceable?: boolean;
  appliedCoupon?: {
    code: string;
    title: string;
    discountAmount: number;
  } | null;
  taxBreakdown: {
    gst: number;
    cgst: number;
    sgst: number;
    igst: number;
    taxType: string;
  };
  paymentMethods: {
    id: string;
    code: string;
    name: string;
    description: string;
    isAvailable: boolean;
    badge?: string;
  }[];
  warnings: string[];
}

export function ReviewStep({ onPlaceOrder }: { onPlaceOrder?: () => void }) {
  const router = useRouter();
  const { address, deliveryMethod, paymentMethod, appliedCoupon, prevStep, setPaymentMethod } =
    useCheckout();

  const [previewData, setPreviewData] = useState<OrderPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialPaymentCode = paymentMethod?.id?.toUpperCase() === 'COD' ? 'COD' : 'ONLINE';
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ONLINE' | 'COD'>(
    initialPaymentCode,
  );
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  useEffect(() => {
    if (paymentMethod?.id) {
      const code = paymentMethod.id.toUpperCase() === 'COD' ? 'COD' : 'ONLINE';
      setSelectedPaymentMethod(code);
    }
  }, [paymentMethod?.id]);

  const fetchOrderPreview = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      try {
        await useCartStore.getState().mergeGuestCart();
      } catch {}

      const clientItems = useCartStore.getState().items;

      const res = await fetch(`/api/v1/orders/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: address?.id,
          couponCode: appliedCoupon?.code,
          shippingMethodCode: deliveryMethod?.id ? deliveryMethod.id.toUpperCase() : 'STANDARD',
          items: clientItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || undefined,
            quantity: i.quantity,
            name: i.name || (i as any).productName,
            price: i.price,
            image: i.image,
          })),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);

        // Pre-set payment method in context
        const selected = json.data.paymentMethods.find((m: any) => m.id === selectedPaymentMethod);
        if (selected) {
          setPaymentMethod({
            id: selected.id,
            name: selected.name,
            description: selected.description,
          });
        }
      } else {
        setErrorMsg(json.message || 'Failed to load order preview.');
      }
    } catch {
      setErrorMsg('Network error loading order preview.');
    } finally {
      setIsLoading(false);
    }
  }, [
    address?.id,
    deliveryMethod?.id,
    appliedCoupon?.code,
    selectedPaymentMethod,
    setPaymentMethod,
  ]);

  useEffect(() => {
    fetchOrderPreview();
  }, [fetchOrderPreview]);

  const handleSelectPayment = (methodId: 'ONLINE' | 'COD') => {
    setSelectedPaymentMethod(methodId);
    setPaymentNotice(null);
    if (previewData) {
      const method = previewData.paymentMethods.find((m) => m.id === methodId);
      if (method) {
        setPaymentMethod({
          id: method.id,
          name: method.name,
          description: method.description,
        });
      }
    }
  };

  const handlePaymentFailure = useCallback((reason: string) => {
    console.warn('[ONLINE_PAYMENT_FAILURE]', reason);
    setIsPlacing(false);
    setPaymentNotice(null);
    setErrorMsg(
      `Online payment failed (${reason}). Please choose another payment option or try Cash on Delivery (COD).`,
    );

    // Trigger non-blocking Admin Alert Notification
    fetch('/api/v1/notifications/admin-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ADMIN_PAYMENT_FAILURE',
        title: 'Online Payment Failed / Cancelled',
        message: `Customer payment failed or cancelled. Reason: ${reason}`,
        variables: {
          failureReason: reason,
        },
      }),
    }).catch(() => {});
  }, []);

  const handleConfirmOrder = async () => {
    if (!agreedTerms) {
      setErrorMsg(
        '⚠️ Please tick and agree to the Terms of Sale, Privacy Policy, and Return Policy before placing your order.',
      );
      return;
    }

    if (!address?.id) {
      alert('Please select a delivery address to proceed.');
      return;
    }

    setIsPlacing(true);
    setErrorMsg(null);
    setPaymentNotice(null);

    // 1. ONLINE (Razorpay Payment Flow)
    if (selectedPaymentMethod === 'ONLINE') {
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          handlePaymentFailure('Failed to load Razorpay Payment Gateway.');
          return;
        }

        const clientItemsPayload = useCartStore.getState().items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
          name: i.name || (i as any).productName,
          price: i.price,
          image: i.image,
          shopId: i.shopId || 'default-shop',
        }));

        const res = await fetch('/api/v1/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: address.id,
            couponCode: appliedCoupon?.code,
            shippingMethodCode: deliveryMethod?.id ? deliveryMethod.id.toUpperCase() : 'STANDARD',
            items: clientItemsPayload,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          handlePaymentFailure(json.message || 'Could not initiate Razorpay payment order.');
          return;
        }

        const { razorpayOrderId, amount, currency, keyId, customer } = json.data;

        // Reset placing state immediately so main page is interactive and never stuck in "Processing Order..."
        setIsPlacing(false);
        setPaymentNotice(
          'Razorpay payment gateway window open. Complete your transaction in the popup window.',
        );

        const options = {
          key: keyId,
          amount,
          currency,
          name: 'Navya Collection',
          description: 'Payment for Fashion & Apparel Order',
          image: '/logo.png',
          order_id: razorpayOrderId,
          prefill: {
            name: (address as any)?.fullName || address?.name || customer?.name || 'Customer',
            email: customer?.email || 'customer@navyacollection.store',
            contact: address?.mobile || customer?.mobile || '',
          },
          theme: {
            color: '#1B2A4A',
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
          modal: {
            confirm_close: true,
            ondismiss: function () {
              handlePaymentFailure('Payment cancelled or popup closed.');
            },
          },
          handler: async function (response: any) {
            setIsPlacing(true);
            setPaymentNotice('Verifying payment signature securely...');

            try {
              const verifyRes = await fetch('/api/v1/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  addressId: address.id,
                  couponCode: appliedCoupon?.code,
                }),
              });

              const verifyJson = await verifyRes.json();
              if (verifyRes.ok && verifyJson.success && verifyJson.data) {
                try {
                  useCartStore.getState().clearCart();
                } catch {}

                if (onPlaceOrder) onPlaceOrder();
                router.push(`/checkout/success?orderNumber=${verifyJson.data.orderNumber}`);
              } else {
                handlePaymentFailure(
                  verifyJson.message || 'Payment signature verification failed.',
                );
              }
            } catch (err: any) {
              handlePaymentFailure(err.message || 'Verification error occurred.');
            }
          },
        };

        const razorpayObj = new (window as any).Razorpay(options);
        razorpayObj.on('payment.failed', function (failureResponse: any) {
          console.error('[RAZORPAY_PAYMENT_FAILED]', failureResponse.error);
          handlePaymentFailure(
            failureResponse.error?.description || 'Transaction declined by bank.',
          );
        });

        razorpayObj.open();
      } catch (err: any) {
        handlePaymentFailure(err.message || 'Failed to initiate Razorpay checkout.');
      }
      return;
    }

    // 2. COD (Cash On Delivery Flow)
    try {
      const clientItemsPayload = useCartStore.getState().items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
        name: i.name || (i as any).productName,
        price: i.price,
        image: i.image,
      }));

      const res = await fetch('/api/v1/payments/create-cod-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: address.id,
          couponCode: appliedCoupon?.code,
          shippingMethodCode: deliveryMethod?.id ? deliveryMethod.id.toUpperCase() : 'STANDARD',
          items: clientItemsPayload,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        try {
          useCartStore.getState().clearCart();
        } catch {}

        if (onPlaceOrder) onPlaceOrder();
        router.push(`/checkout/success?orderNumber=${json.data.orderNumber}`);
      } else {
        setErrorMsg(json.message || 'Failed to place COD order.');
        setIsPlacing(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error placing COD order.');
      setIsPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (errorMsg && !previewData) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 space-y-4 text-center">
        <p className="text-sm font-semibold text-red-600">
          {errorMsg || 'Could not load order preview.'}
        </p>
        <Button onClick={fetchOrderPreview} className="rounded-full text-xs font-semibold">
          Try Again
        </Button>
      </div>
    );
  }

  const displayAddress =
    previewData?.address ||
    (address
      ? {
          id: address.id,
          fullName: address.name,
          mobile: address.mobile,
          addressLine1: address.line1,
          addressLine2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          type: address.label || 'HOME',
        }
      : null);

  if (!previewData) return null;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 md:p-8 shadow-card space-y-5 sm:space-y-6 overflow-hidden">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">
            Order Preview & Final Review
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Please verify your delivery address, order items, and payment method before completing
            your purchase.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure 256-Bit SSL Checkout
        </span>
      </div>

      {/* Notifications & Error Alerts */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-xs font-semibold flex items-start justify-between gap-3 shadow-md">
          <div className="space-y-1 min-w-0">
            <span className="font-extrabold text-xs sm:text-sm text-red-900 flex items-center gap-1.5">
              ⚠️ Payment Failed / Declined
            </span>
            <p className="text-xs text-red-700 font-bold leading-relaxed break-words">{errorMsg}</p>
          </div>
          <button
            type="button"
            className="text-xs bg-red-100 hover:bg-red-200 text-red-900 px-3 py-1.5 rounded-full font-extrabold shrink-0 cursor-pointer transition-colors"
            onClick={() => setErrorMsg(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {paymentNotice && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2 shadow-xs break-words">
          <Loader size="sm" />
          <span>{paymentNotice}</span>
        </div>
      )}

      {/* Warnings & Notices */}
      {previewData.warnings && previewData.warnings.length > 0 && !displayAddress && (
        <div className="space-y-2">
          {previewData.warnings.map((w, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 break-words"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Delivery Address & Estimate */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
              <MapPin className="h-4 w-4 text-navy shrink-0" /> Delivery Address
            </span>
            <button
              type="button"
              onClick={prevStep}
              className="text-xs font-semibold text-navy underline hover:text-navy/80 cursor-pointer"
            >
              Change
            </button>
          </div>

          {displayAddress ? (
            <div className="text-xs sm:text-sm text-slate-700 space-y-0.5 break-words">
              <p className="font-bold text-navy">
                {displayAddress.fullName} ({displayAddress.type || 'HOME'})
              </p>
              <p className="text-xs font-medium text-slate-600">📱 {displayAddress.mobile}</p>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                {displayAddress.addressLine1}
                {displayAddress.addressLine2 ? `, ${displayAddress.addressLine2}` : ''}
                <br />
                {displayAddress.city}, {displayAddress.state} —{' '}
                <strong className="text-navy">{displayAddress.pincode}</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-red-500 font-semibold">No delivery address selected!</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-navy shrink-0" /> Shipping & Delivery
          </span>

          <div className="text-xs sm:text-sm space-y-1 break-words">
            <p className="font-extrabold text-navy text-sm sm:text-base">
              {deliveryMethod?.name ||
                (previewData.shipping === 49 ? 'Standard Delivery' : 'Express Delivery')}
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Estimated Arrival:{' '}
              <strong className="text-emerald-700 font-extrabold">
                {deliveryMethod?.estimatedDays ||
                  previewData.estimatedDelivery ||
                  (previewData.shipping === 49 ? '5-7 business days' : '2-3 business days')}
              </strong>
            </p>
            <p className="text-xs font-medium text-slate-600">
              Shipping Fee:{' '}
              {(deliveryMethod?.price !== undefined
                ? deliveryMethod.price
                : previewData.shipping) === 0 ? (
                <span className="font-black text-emerald-600">FREE</span>
              ) : (
                <strong className="font-extrabold text-navy">
                  ₹
                  {deliveryMethod?.price !== undefined
                    ? deliveryMethod.price
                    : previewData.shipping}
                </strong>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Order Items List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Order Items ({previewData.itemCount || previewData.items.length} item
          {(previewData.itemCount || previewData.items.length) > 1 ? 's' : ''})
        </h3>

        <div className="space-y-2.5">
          {previewData.items.map((item) => (
            <div
              key={item.id || item.productId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 sm:p-3.5 bg-white min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <Image
                    src={
                      item.image ||
                      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'
                    }
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-navy line-clamp-1 break-words">
                    {item.productName || item.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {item.size && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Color: {item.color}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-medium">
                      Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                <span className="font-bold text-navy text-xs sm:text-sm block">
                  ₹{item.subtotal.toLocaleString('en-IN')}
                </span>
                {item.inStock ? (
                  <span className="text-[10px] font-bold text-emerald-600">In Stock</span>
                ) : (
                  <span className="text-[10px] font-bold text-red-500">Low Stock</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Payment Method Selection */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <CreditCard className="h-4 w-4 text-navy shrink-0" /> Choose Payment Option
        </h3>

        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
          {previewData.paymentMethods.map((method) => (
            <label
              key={method.id}
              onClick={() => method.isAvailable && handleSelectPayment(method.id as any)}
              className={`flex items-start gap-2.5 sm:gap-3 rounded-2xl border p-3 sm:p-4 transition cursor-pointer min-w-0 ${
                selectedPaymentMethod === method.id
                  ? 'border-navy ring-2 ring-navy/15 bg-slate-50/80'
                  : 'border-slate-200 hover:border-slate-300'
              } ${!method.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="payment_option"
                checked={selectedPaymentMethod === method.id}
                disabled={!method.isAvailable}
                onChange={() => handleSelectPayment(method.id as any)}
                className="mt-0.5 h-4 w-4 accent-navy shrink-0 cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-navy text-xs sm:text-sm">{method.name}</span>
                  {method.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed break-words">
                  {method.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section 4: Terms Agreement & Confirm CTA */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-navy shrink-0 cursor-pointer"
          />
          <span className="text-xs text-slate-600 font-medium leading-normal break-words">
            I agree to the <strong className="text-navy underline">Terms of Sale</strong>, Privacy
            Policy, and Return Policy.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            className="rounded-full text-xs font-semibold py-3 sm:py-2.5 px-5 w-full sm:w-auto"
            onClick={prevStep}
            disabled={isPlacing}
          >
            ← Back to Payment
          </Button>

          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={isPlacing || !previewData.isServiceable}
            className="w-full sm:w-auto flex-1 sm:flex-initial rounded-full font-extrabold text-xs sm:text-sm px-6 py-3.5 sm:py-4 bg-orange hover:bg-orange-600 text-white shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-center break-words"
          >
            {isPlacing ? (
              <Loader light size="sm" text="Processing Order..." />
            ) : selectedPaymentMethod === 'ONLINE' ? (
              `Pay ₹${previewData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Now`
            ) : (
              `Place COD Order (₹${previewData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
