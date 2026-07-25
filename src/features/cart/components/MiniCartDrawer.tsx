'use client';

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

type MiniCartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MiniCartDrawer({ open, onClose }: MiniCartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <Drawer open={open} onClose={onClose} title={`Cart (${items.length})`} side="right">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-heading text-xl text-navy">Your cart is empty</h3>
          <p className="mt-2 text-sm text-slate-600">Add items to your cart to see them here.</p>
          <Button className="mt-4 rounded-full" asChild>
            <Link href="/shop" onClick={onClose}>
              Shop Now
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-sky-50 to-orange-50" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-navy truncate">{item.name}</h4>
                  <p className="text-xs text-slate-600">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-semibold text-navy w-6 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="rounded-full p-1 text-slate-400 hover:text-error"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="text-xs font-semibold text-navy">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-semibold text-navy">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-full" onClick={clearCart}>
                Clear Cart
              </Button>
              <Button className="rounded-full" asChild>
                <Link href="/checkout" onClick={onClose}>
                  Checkout
                </Link>
              </Button>
            </div>
            <Button variant="ghost" className="w-full rounded-full" asChild>
              <Link href="/cart" onClick={onClose}>
                View Cart
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
