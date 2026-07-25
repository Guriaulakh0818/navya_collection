'use client';

import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import Image from 'next/image';
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
  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shipping = subtotal >= freeShippingThreshold || items.length === 0 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <Drawer open={open} onClose={onClose} title={`My Shopping Bag (${items.length})`} side="right">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-brand-divider flex items-center justify-center text-brand-muted mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="font-heading text-xl font-bold text-navy">Your cart is empty</h3>
          <p className="mt-1 text-xs text-brand-muted max-w-xs">
            Explore our Gents & Kids clothing collections and fill your bag with premium fashion!
          </p>
          <Button
            className="mt-6 rounded-full bg-navy text-xs font-bold px-6"
            onClick={onClose}
            asChild
          >
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between">
          {/* Free shipping progress */}
          <div className="mb-4 rounded-2xl bg-orange/10 p-3 text-xs text-orange font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0" />
            {remainingForFreeShipping > 0 ? (
              <span>
                Add <strong>{formatPrice(remainingForFreeShipping)}</strong> more for{' '}
                <strong>FREE Shipping</strong>!
              </span>
            ) : (
              <span>
                🎉 Congratulations! You qualify for <strong>FREE Shipping</strong>!
              </span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id || item.productId}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-all"
              >
                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      NAVYA
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id || item.productId, Math.max(1, item.quantity - 1))
                      }
                      className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold text-navy w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id || item.productId, item.quantity + 1)}
                      className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.id || item.productId)}
                    className="rounded-full p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="text-xs font-bold text-navy">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Subtotal */}
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 bg-white">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Bag Subtotal</span>
              <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Estimated Shipping</span>
              <span className="font-bold text-emerald-600">
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-slate-100">
              <span>Total Payable</span>
              <span className="text-base text-orange">{formatPrice(total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-full text-xs font-bold"
                onClick={clearCart}
              >
                Clear
              </Button>
              <Button
                className="rounded-full text-xs font-bold bg-orange hover:bg-orange-hover text-white shadow-md"
                onClick={onClose}
                asChild
              >
                <Link href="/checkout">Checkout Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
