'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckoutPage() {
  const [step, setStep] = useState<'address' | 'payment' | 'review'>('address');

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
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 'address' && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
                <h2 className="font-heading text-xl text-navy mb-4">Delivery Address</h2>
                <div className="grid gap-4">
                  <Input placeholder="Full Name" />
                  <Input placeholder="Mobile Number" />
                  <Input placeholder="Address Line 1" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="City" />
                    <Input placeholder="Pincode" />
                  </div>
                </div>
                <Button onClick={() => setStep('payment')} className="mt-4 rounded-full">
                  Continue to Payment
                </Button>
              </div>
            )}
            {step === 'payment' && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
                <h2 className="font-heading text-xl text-navy mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 rounded-xl border border-border p-4 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-semibold text-navy">Cash on Delivery</p>
                      <p className="text-sm text-slate-600">Pay when you receive</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-border p-4 cursor-pointer">
                    <input type="radio" name="payment" value="online" className="h-4 w-4" />
                    <div>
                      <p className="font-semibold text-navy">Pay Online</p>
                      <p className="text-sm text-slate-600">UPI, Cards, Wallets</p>
                    </div>
                  </label>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('address')}
                    className="rounded-full"
                  >
                    Back
                  </Button>
                  <Button onClick={() => setStep('review')} className="rounded-full">
                    Review Order
                  </Button>
                </div>
              </div>
            )}
            {step === 'review' && (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
                <h2 className="font-heading text-xl text-navy mb-4">Review Order</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Please review your order before placing it.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('payment')}
                    className="rounded-full"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => alert('Order placed successfully!')}
                    className="rounded-full"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
            <h3 className="font-heading text-xl text-navy mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹2,697</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-navy">
                <span>Total</span>
                <span>₹2,697</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
