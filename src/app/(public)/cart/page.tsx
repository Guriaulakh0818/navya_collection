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
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Multi-vendor shipping estimate (₹49 per vendor or FREE if shop subtotal >= 999)
  const shippingTotal = shopGroups.reduce((total, group) => {
    return total + (group.subtotal >= 999 ? 0 : 49);
  }, 0);

  const grandTotal = Math.max(0, grandSubtotal - discountAmount + shippingTotal);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Multi-Vendor Cart' }]}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
        />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto text-amber-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Your Marketplace Cart is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Discover luxury sarees, lehengas, and designer couture from verified boutique partner
            stores.
          </p>
          <Button
            className="mt-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 text-xs"
            asChild
          >
            <Link href="/shop">Explore Marketplace Stores</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Multi-Vendor Cart' }]}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Multi-Vendor Shopping Bag ({items.length} Items)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Products grouped by seller boutique for transparent fulfillment and payouts.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
            onClick={clearCart}
          >
            Clear Entire Bag
          </Button>
        </div>

        {/* MAIN LAYOUT: SHOP GROUPS + ORDER SUMMARY */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* SHOP GROUPS LIST */}
          <div className="lg:col-span-2 space-y-8">
            {shopGroups.map((group) => (
              <div
                key={group.shopId}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4"
              >
                {/* Shop Header */}
                <div className="bg-slate-950/80 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 overflow-hidden shrink-0 flex items-center justify-center text-amber-400 relative">
                      {group.shopLogo ? (
                        <Image
                          src={group.shopLogo}
                          alt={group.shopName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shop/${group.shopSlug || ''}`}
                          className="font-extrabold text-white text-sm hover:text-amber-400 transition-colors flex items-center gap-1"
                        >
                          {group.shopName} <ChevronRight className="w-4 h-4 text-slate-500" />
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED SELLER
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {group.itemCount} item(s) from this boutique store
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Shop Subtotal
                    </span>
                    <span className="text-sm font-extrabold text-amber-400 font-mono">
                      {formatPrice(group.subtotal)}
                    </span>
                  </div>
                </div>

                {/* Shop Items List */}
                <div className="p-4 sm:p-6 space-y-4 divide-y divide-slate-800/60">
                  {group.items.map((item) => {
                    const targetKey = item.id || item.productId;
                    return (
                      <div
                        key={targetKey}
                        className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="h-20 w-20 shrink-0 rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-800">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-700">
                                <Tag className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                              {item.size && (
                                <span>
                                  Size: <strong className="text-white">{item.size}</strong>
                                </span>
                              )}
                              {item.color && (
                                <span>
                                  Color: <strong className="text-white">{item.color}</strong>
                                </span>
                              )}
                              <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                In Stock
                              </span>
                            </div>
                            <p className="text-sm font-extrabold text-amber-400 font-mono">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>

                        {/* Quantity & Delete */}
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                            <button
                              onClick={() =>
                                updateQuantity(targetKey, Math.max(1, item.quantity - 1))
                              }
                              className="h-7 w-7 rounded-lg border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-800"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(targetKey, item.quantity + 1)}
                              className="h-7 w-7 rounded-lg border border-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-800"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(targetKey)}
                            className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800/80 transition-colors"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <h2 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                Order Summary Breakdown
              </h2>

              {/* Per-Shop Subtotals */}
              <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Shop Subtotals
                </span>
                {shopGroups.map((g) => (
                  <div key={g.shopId} className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[180px]">{g.shopName}</span>
                    <span className="font-mono text-white">{formatPrice(groupSubtotal(g))}</span>
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
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Gross Subtotal</span>
                  <span className="font-mono text-white font-bold">
                    {formatPrice(grandSubtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span className="font-mono">- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300">
                  <span>Multi-Vendor Shipping Estimate</span>
                  <span className="font-mono text-amber-400">
                    {shippingTotal === 0 ? 'FREE' : formatPrice(shippingTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-white pt-4 border-t border-slate-800">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-400 text-lg">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                asChild
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Link href="/checkout">Proceed to Multi-Vendor Checkout →</Link>
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
