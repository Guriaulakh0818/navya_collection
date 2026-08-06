'use client';

import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

import type { CartItem } from '../types';

export function CartReviewStep() {
  const { items, updateItemQuantity, removeItem, nextStep } = useCheckout();
  const cartItems = useCartStore((s) => s.items);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 99;
  const total = subtotal + (subtotal >= 999 ? 0 : shipping);

  const handleQuantityChange = (productId: string, delta: number, current: number) => {
    const newQty = Math.max(1, current + delta);
    updateItemQuantity(productId, newQty);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="font-heading text-2xl font-bold text-navy">Review Your Cart</h2>
        <span className="text-xs font-bold text-orange bg-orange/10 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item: CartItem) => (
          <div
            key={item.productId}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 p-4 md:flex-row md:items-center md:justify-between hover:border-slate-300 transition-all bg-slate-50/40"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    NAVYA
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-navy text-sm sm:text-base truncate">{item.name}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-slate-200 shadow-xs">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100"
                  onClick={() => handleQuantityChange(item.productId, -1, item.quantity)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItemQuantity(item.productId, Math.max(1, Number(e.target.value)))
                  }
                  className="w-12 h-7 text-center text-xs font-bold border-none p-0 focus:ring-0"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100"
                  onClick={() => handleQuantityChange(item.productId, 1, item.quantity)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm font-black text-navy w-24 text-right">
                {formatPrice(item.price * item.quantity)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4 bg-slate-50/60 p-4 rounded-2xl border">
        <div className="flex justify-between font-medium">
          <span>Subtotal</span>
          <span className="font-bold text-navy">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Shipping</span>
          <span className="font-bold text-emerald-600">
            {subtotal >= 999 ? 'FREE' : formatPrice(shipping)}
          </span>
        </div>
        {subtotal < 999 && (
          <p className="text-xs font-semibold text-orange">
            Add {formatPrice(999 - subtotal)} more for FREE Shipping!
          </p>
        )}
        <div className="flex justify-between font-black text-navy text-base pt-3 border-t border-slate-200">
          <span>Total</span>
          <span className="text-orange text-lg">{formatPrice(total)}</span>
        </div>
      </div>

      {/* High-Visibility Brand Orange Action Button */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
        <Button
          type="button"
          onClick={nextStep}
          className="rounded-full bg-orange hover:bg-orange-hover text-white font-extrabold text-sm sm:text-base px-8 h-12 shadow-lg shadow-orange/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
        >
          <span>Continue to Address</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
