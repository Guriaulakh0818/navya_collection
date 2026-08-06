'use client';

import {
  Building2,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
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
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  const shopGroups = groupCartItemsByShop(items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shipping = subtotal >= 999 || items.length === 0 ? 0 : 49;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Multi-Vendor Cart (${items.length})`}
      side="right"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 py-16 text-center h-full">
          <div className="h-16 w-16 rounded-full bg-brand-divider flex items-center justify-center text-brand-muted mb-4">
            <ShoppingBag className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="font-heading text-xl font-bold text-navy">Your cart is empty</h3>
          <p className="mt-1 text-xs text-brand-muted max-w-xs">
            Explore luxury ethnic couture and boutique collections!
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
        <div className="flex h-full flex-col justify-between overflow-hidden p-4 min-h-0">
          {/* Free Shipping Notification */}
          <div className="mb-3 rounded-2xl bg-orange/10 p-3 text-xs text-orange font-semibold flex items-center gap-2 shrink-0">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Multi-Vendor pan-India express shipping.</span>
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
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs text-navy truncate">{group.shopName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 font-mono">
                    Subtotal: {formatPrice(group.subtotal)}
                  </span>
                </div>

                {/* Items in Shop */}
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div
                      key={item.id || item.productId}
                      className="flex gap-3 rounded-xl border border-slate-100 bg-white p-2.5 shadow-xs"
                    >
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
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
                          <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id || item.productId,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id || item.productId, item.quantity + 1)
                            }
                            className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => removeItem(item.id || item.productId)}
                            className="ml-auto text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
              className="w-full rounded-xl bg-navy text-white text-xs font-extrabold py-3 hover:bg-navy/90"
              onClick={onClose}
              asChild
            >
              <Link href="/cart">View Full Multi-Vendor Cart →</Link>
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
