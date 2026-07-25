'use client';

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]}
          className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
        />
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-20 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-6 font-heading text-3xl text-navy">Your Cart is Empty</h1>
          <p className="mt-2 text-sm text-slate-600">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl text-navy">Shopping Cart</h1>
          <Button variant="outline" className="rounded-full" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4"
              >
                <div className="h-24 w-24 flex-shrink-0 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-navy truncate">{item.name}</h3>
                  <p className="text-sm text-slate-600">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.productId, Math.max(1, Number(e.target.value)))
                      }
                      className="w-16 text-center"
                      min={1}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-error hover:text-error"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium h-fit">
            <h3 className="font-heading text-xl text-navy mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-slate-500">
                  Add {formatPrice(999 - subtotal)} more for free shipping
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-navy text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 rounded-full">Proceed to Checkout</Button>
            </Link>
            <Button variant="outline" className="w-full mt-3 rounded-full" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
