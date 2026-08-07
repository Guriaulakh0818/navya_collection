'use client';

import {
  Building2,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CouponInputCard, type AppliedCoupon } from '@/features/coupons/components/CouponInputCard';
import { groupCartItemsByShop } from '@/frontend/features/cart/utils/group-cart-by-shop';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

export default function MultiVendorCartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  // Group items by Boutique Shop
  const shopGroups = groupCartItemsByShop(items);

  // Calculate Order Totals
  const grandSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;

  // Shipping estimate (FREE if shop subtotal >= 999 else ₹49 per vendor)
  const shippingTotal = shopGroups.reduce((total, group) => {
    return total + (group.subtotal >= 999 ? 0 : 49);
  }, 0);

  const grandTotal = Math.max(0, grandSubtotal - discountAmount + shippingTotal);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag' }]}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5"
        />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 border-2 border-amber-200 rounded-3xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-navy">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Discover luxury sarees, lehengas, and designer couture from verified boutique partner
            stores.
          </p>
          <Button
            className="mt-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange hover:from-amber-600 hover:to-orange/90 text-white font-extrabold px-6 sm:px-8 py-3 text-xs shadow-md shadow-orange/20 cursor-pointer"
            asChild
          >
            <Link href="/shop">Explore Boutique Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag' }]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5"
      />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Header Title */}
        <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-6">
          <div>
            <h1 className="text-lg xs:text-xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Shopping Bag ({items.length})
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              Review your selected items from verified boutique stores.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold shadow-xs cursor-pointer shrink-0"
            onClick={clearCart}
          >
            Clear Bag
          </Button>
        </div>

        {/* MAIN LAYOUT: SHOP GROUPS + ORDER SUMMARY */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* SHOP GROUPS LIST */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
            {shopGroups.map((group) => (
              <div
                key={group.shopId}
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow space-y-3 sm:space-y-4"
              >
                {/* Shop Header (100% Responsive layout for mobile 320px-414px) */}
                <div className="bg-amber-50/70 border-b border-amber-200/70 p-3 sm:p-5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full xs:w-auto">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-amber-300 overflow-hidden shrink-0 flex items-center justify-center text-amber-700 shadow-xs relative">
                      {group.shopLogo ? (
                        <Image
                          src={group.shopLogo}
                          alt={group.shopName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Link
                          href={`/shop/${group.shopSlug || ''}`}
                          className="font-extrabold text-navy text-xs sm:text-sm hover:text-amber-700 transition-colors flex items-center gap-1 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none"
                        >
                          <span className="truncate">{group.shopName}</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                        </Link>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs shrink-0">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" /> VERIFIED
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium block truncate">
                        {group.itemCount} item(s) from this store
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between xs:block w-full xs:w-auto text-left xs:text-right pt-1.5 xs:pt-0 border-t xs:border-t-0 border-amber-200/60">
                    <span className="text-[9px] sm:text-[10px] uppercase text-slate-500 font-extrabold block">
                      Shop Subtotal
                    </span>
                    <span className="text-xs sm:text-sm font-black text-navy font-mono">
                      {formatPrice(group.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Shop Items List */}
                <div className="p-3 sm:p-6 space-y-3.5 sm:space-y-4 divide-y divide-slate-100">
                  {group.items.map((item) => {
                    const targetKey = item.id || item.productId;
                    return (
                      <div
                        key={targetKey}
                        className="pt-3.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl sm:rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200 shadow-xs">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400">
                                <Tag className="w-6 h-6 sm:w-8 sm:h-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                            <h3 className="font-extrabold text-navy text-xs sm:text-sm truncate">
                              {item.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-600 font-medium">
                              {item.size && (
                                <span>
                                  Size: <strong className="text-navy">{item.size}</strong>
                                </span>
                              )}
                              {item.color && (
                                <span>
                                  Color: <strong className="text-navy">{item.color}</strong>
                                </span>
                              )}
                              <span className="text-emerald-700 text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                In Stock
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-black text-navy font-mono pt-0.5">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls & Delete Button */}
                        <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-xs">
                            <button
                              onClick={() =>
                                updateQuantity(targetKey, Math.max(1, item.quantity - 1))
                              }
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 sm:w-8 text-center text-xs font-black text-navy font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(targetKey, item.quantity + 1)}
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(targetKey)}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
              <h2 className="text-sm sm:text-base font-extrabold text-navy uppercase tracking-wider border-b border-slate-200 pb-3">
                Order Summary
              </h2>

              {/* Per-Shop Subtotals */}
              <div className="space-y-2 text-xs border-b border-slate-200 pb-4">
                <span className="text-slate-500 font-extrabold uppercase text-[10px] block">
                  Item Subtotals
                </span>
                {shopGroups.map((g) => (
                  <div key={g.shopId} className="flex justify-between text-slate-700 font-medium">
                    <span className="truncate max-w-[170px]">{g.shopName}</span>
                    <span className="font-mono text-navy font-extrabold">
                      {formatPrice(groupSubtotal(g))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <CouponInputCard
                cartAmount={grandSubtotal}
                appliedCoupon={appliedCoupon}
                onApplySuccess={(coupon: AppliedCoupon) => setAppliedCoupon(coupon)}
                onRemoveCoupon={() => setAppliedCoupon(null)}
              />

              {/* Subtotal, Shipping, Discount & Grand Total */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Gross Subtotal</span>
                  <span className="font-mono text-navy font-extrabold">
                    {formatPrice(grandSubtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Standard Delivery</span>
                  <span className="font-mono text-amber-700 font-extrabold">
                    {shippingTotal === 0 ? 'FREE' : formatPrice(shippingTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-navy pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700 text-lg sm:text-xl font-black">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                asChild
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 to-orange hover:from-amber-600 hover:to-orange/90 text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md shadow-orange/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Link href="/checkout">Proceed to Checkout →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function groupSubtotal(group: any) {
  return group.subtotal || 0;
}
