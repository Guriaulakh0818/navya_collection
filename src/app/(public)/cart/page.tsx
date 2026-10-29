'use client';

import { AlertCircle, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const removeUnavailableItems = useCartStore((s) => s.removeUnavailableItems);
  const validateCart = useCartStore((s) => s.validateCart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);

  useEffect(() => {
    validateCart();
  }, [validateCart]);

  // Group items by Boutique Shop
  const shopGroups = groupCartItemsByShop(items);

  const availableItems = items.filter((item) => item.isAvailable !== false);
  const unavailableItems = items.filter((item) => item.isAvailable === false);
  const hasUnavailable = unavailableItems.length > 0;

  // Calculate Order Totals
  const grandSubtotal = availableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;

  // Shipping estimate (FREE if shop subtotal >= 999 else ₹49 per vendor)
  const shippingTotal =
    availableItems.length === 0
      ? 0
      : shopGroups.reduce((total, group) => {
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
        <div className="mx-auto max-w-lg px-4 py-12 sm:py-16 text-center space-y-5">
          {/* Jiivaa Mascot Empty Cart Delight */}
          <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            <div className="absolute inset-0 bg-radial from-orange/20 via-orange/5 to-transparent rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white border-2 border-orange-100 shadow-md p-2 flex items-center justify-center overflow-hidden">
              <Image
                src="/brand/jiivaa/crops/journey/04-add-to-cart.png"
                alt="Jiivaa - Add to Cart"
                width={160}
                height={165}
                className="w-full h-full object-contain select-none"
                priority
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-navy text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-white">
              <span>JiivaaKart</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Aapka Cart Abhi Khali Hai!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Discover unique styles from verified local boutiques across India. Jiivaa is waiting
              to pack your favorites!
            </p>
          </div>

          <Button
            className="rounded-full bg-orange hover:bg-orange-600 text-white font-extrabold px-6 sm:px-8 py-2.5 text-xs shadow-md shadow-orange/25 cursor-pointer"
            asChild
          >
            <Link href="/shop">Start Shopping &rarr;</Link>
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

        {/* Unavailable items warning banner */}
        {hasUnavailable && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-rose-950 text-xs sm:text-sm">
                  {unavailableItems.length} item(s) in your shopping bag are currently unavailable
                </p>
                <p className="text-rose-700 text-[11px] sm:text-xs">
                  Unavailable items are excluded from your payable subtotal. You can remove them and
                  proceed with your available items.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeUnavailableItems()}
              className="rounded-full border-rose-300 bg-white hover:bg-rose-100 text-rose-800 text-xs font-extrabold px-4 py-1.5 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Remove Unavailable Items
            </Button>
          </div>
        )}

        {/* MAIN LAYOUT: CART ITEMS + ORDER SUMMARY */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* CART ITEMS LIST */}
          <div className="lg:col-span-2 min-w-0">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
              {/* Items List */}
              <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 divide-y divide-slate-100">
                {items.map((item) => {
                  return (
                    <div
                      key={item.id}
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
                            {item.isAvailable === false ? (
                              <span className="text-rose-800 text-[9px] sm:text-[10px] font-extrabold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> Currently
                                unavailable
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-[9px] sm:text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                In Stock
                              </span>
                            )}
                          </div>

                          {item.isAvailable === false ? (
                            <div className="pt-0.5">
                              <span className="text-xs sm:text-sm line-through text-slate-400 font-mono">
                                {formatPrice(item.price)}
                              </span>
                              <span className="text-[10px] text-rose-600 font-extrabold block">
                                Excluded from subtotal
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm font-black text-navy font-mono pt-0.5">
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls & Delete Button */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.isAvailable === false ? (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-xs">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg border bg-white flex items-center justify-center transition-colors cursor-pointer ${
                                item.quantity <= 1
                                  ? 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                              aria-label={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                              title={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                            >
                              {item.quantity <= 1 ? (
                                <Trash2 className="h-3 w-3 text-rose-600" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </button>
                            <span className="w-6 sm:w-8 text-center text-xs font-black text-navy font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => removeItem(item.id)}
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
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
              <h2 className="text-sm sm:text-base font-extrabold text-navy uppercase tracking-wider border-b border-slate-200 pb-3">
                Order Summary
              </h2>

              {/* Per-Shop Subtotals (only shown when multiple vendors) */}
              {shopGroups.length > 1 && (
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
              )}

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
                  <span className="font-mono text-navy font-extrabold">
                    {shippingTotal === 0 ? 'FREE' : formatPrice(shippingTotal)}
                  </span>
                </div>
                {shopGroups.length > 1 && (
                  <p className="text-[10px] text-slate-500 italic">
                    Free shipping (₹999+) is calculated independently per seller shipment.
                  </p>
                )}

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-navy pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700 text-lg sm:text-xl font-black">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                disabled={availableItems.length === 0}
                asChild={availableItems.length > 0}
                className={`w-full py-3.5 sm:py-4 font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 ${
                  availableItems.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-orange hover:bg-orange-600 text-white shadow-md shadow-orange/25 active:scale-95 cursor-pointer'
                }`}
              >
                {availableItems.length > 0 ? (
                  <Link href="/checkout">
                    <span>
                      Proceed to Checkout ({availableItems.length}{' '}
                      {availableItems.length === 1 ? 'item' : 'items'}) →
                    </span>
                  </Link>
                ) : (
                  <span>No Available Items to Checkout</span>
                )}
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
