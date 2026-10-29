'use client';

import {
  AlertCircle,
  Building2,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { CouponInputCard } from '@/features/coupons/components/CouponInputCard';
import { groupCartItemsByShop } from '@/frontend/features/cart/utils/group-cart-by-shop';
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
  const removeUnavailableItems = useCartStore((s) => s.removeUnavailableItems);
  const validateCart = useCartStore((s) => s.validateCart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  useEffect(() => {
    if (open) {
      validateCart();
    }
  }, [open, validateCart]);

  const shopGroups = groupCartItemsByShop(items);
  const availableItems = items.filter((item) => item.isAvailable !== false);
  const unavailableItems = items.filter((item) => item.isAvailable === false);
  const hasUnavailable = unavailableItems.length > 0;

  const subtotal = availableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shipping = availableItems.length === 0 || subtotal >= 999 ? 0 : 49;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Multi-Vendor Cart (${items.length})`}
      side="right"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 py-12 text-center h-full space-y-4">
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-lg pointer-events-none" />
            <div className="relative z-10 w-24 h-24 rounded-2xl bg-white border border-orange-200 shadow-sm p-1.5 flex items-center justify-center overflow-hidden">
              <Image
                src="/brand/jiivaa/crops/journey/04-add-to-cart.png"
                alt="Jiivaa - Empty Cart"
                width={160}
                height={165}
                className="w-full h-full object-contain select-none"
              />
            </div>
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-navy">Your cart is empty</h3>
            <p className="mt-1 text-xs text-brand-muted max-w-xs">
              Explore authentic local boutique fashion across India!
            </p>
          </div>
          <Button
            className="rounded-full bg-orange hover:bg-orange-600 text-white text-xs font-bold px-6 shadow-sm cursor-pointer"
            onClick={onClose}
            asChild
          >
            <Link href="/shop" className="text-white hover:text-white">
              Start Shopping &rarr;
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between overflow-hidden p-4 min-h-0">
          {/* Top Banner if unavailable items are present */}
          {hasUnavailable && (
            <div className="mb-3 rounded-2xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-950 font-semibold flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="truncate">
                  {unavailableItems.length} item(s) currently unavailable
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeUnavailableItems()}
                className="text-[11px] font-extrabold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
              >
                Remove All
              </button>
            </div>
          )}

          {/* Free Shipping Notification & Clear Cart */}
          <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex-1 rounded-xl bg-orange/10 p-2.5 text-xs text-orange font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Multi-Vendor pan-India express shipping.</span>
            </div>
            <button
              type="button"
              onClick={() => clearCart()}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200"
              title="Clear entire cart"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>

          {/* Grouped Cart Items List */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 min-h-0">
            {shopGroups.map((group) => (
              <div
                key={group.shopId}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 p-3 space-y-3"
              >
                {/* Shop Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange" />
                    <span className="font-bold text-xs text-navy truncate">{group.shopName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-orange font-mono">
                    Subtotal: {formatPrice(group.subtotal)}
                  </span>
                </div>

                {/* Items in Shop */}
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isUnavailable = item.isAvailable === false;

                    return (
                      <div
                        key={item.id}
                        className={`flex gap-3 rounded-xl border p-2.5 shadow-xs transition-all ${
                          isUnavailable
                            ? 'border-rose-200 bg-rose-50/20'
                            : 'border-slate-100 bg-white'
                        }`}
                      >
                        <div
                          className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 border ${
                            isUnavailable ? 'border-rose-200 opacity-60' : 'border-slate-100'
                          }`}
                        >
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              BOUTIQUE
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4
                              className={`text-xs font-bold truncate ${
                                isUnavailable ? 'text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {item.name}
                            </h4>
                            {(item.color || item.size || item.variantName) && (
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-0.5">
                                {item.color && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                    Color: <strong>{item.color}</strong>
                                  </span>
                                )}
                                {item.size && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                    Size: <strong>{item.size}</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {isUnavailable ? (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  Currently unavailable
                                </span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-900 font-extrabold mt-0.5">
                                {formatPrice(item.price)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            {isUnavailable ? (
                              <button
                                onClick={() => removeItem(item.id)}
                                className="flex items-center gap-1 text-[10.5px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                                    item.quantity <= 1
                                      ? 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title={
                                    item.quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'
                                  }
                                  aria-label={
                                    item.quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'
                                  }
                                >
                                  {item.quantity <= 1 ? (
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </button>
                                <span className="text-xs font-bold text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto text-slate-400 hover:text-red-500 p-1"
                              title="Delete from cart"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-3 shrink-0">
            <div className="flex justify-between text-xs font-extrabold text-navy">
              <span>Grand Total</span>
              <span className="font-mono text-base text-orange">{formatPrice(total)}</span>
            </div>

            <Button
              className={`w-full rounded-xl text-white text-xs font-extrabold py-3 ${
                availableItems.length === 0
                  ? 'bg-slate-400 cursor-not-allowed hover:bg-slate-400'
                  : 'bg-navy hover:bg-navy/90'
              }`}
              onClick={onClose}
              disabled={availableItems.length === 0}
              asChild={availableItems.length > 0}
            >
              {availableItems.length > 0 ? (
                <Link href="/cart">View Full Multi-Vendor Cart →</Link>
              ) : (
                <span>No Available Items to Checkout</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
