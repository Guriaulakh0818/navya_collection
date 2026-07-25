'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import type { CartItem } from '@/features/checkout/types/checkout.types';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

export function CartReviewStep() {
  const { items, updateItemQuantity, removeItem, nextStep } = useCheckout();
  const cartItems = useCartStore((s) => s.items);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 49;
  const total = subtotal + (subtotal > 999 ? 0 : shipping);

  const handleQuantityChange = (productId: string, delta: number, current: number) => {
    const newQty = Math.max(1, current + delta);
    updateItemQuantity(productId, newQty);
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h2 className="font-heading text-xl text-navy mb-4">Review Your Cart</h2>

      <div className="space-y-4">
        {items.map((item: CartItem) => (
          <div
            key={item.productId}
            className="flex flex-col gap-4 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50" />
              <div>
                <p className="font-semibold text-navy">{item.name}</p>
                <p className="text-sm text-slate-600">{formatPrice(item.price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
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
                  className="w-16 text-center"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleQuantityChange(item.productId, 1, item.quantity)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm font-semibold text-navy w-24 text-right">
                {formatPrice(item.price * item.quantity)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-error hover:text-error"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 text-sm text-slate-600 border-t border-border pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{subtotal > 999 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {subtotal <= 999 && (
          <p className="text-xs text-slate-500">
            Add {formatPrice(999 - subtotal)} more for free shipping
          </p>
        )}
        <div className="flex justify-between font-semibold text-navy text-base pt-2 border-t border-border">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button className="rounded-full" onClick={nextStep}>
          Continue to Address
        </Button>
      </div>
    </div>
  );
}
