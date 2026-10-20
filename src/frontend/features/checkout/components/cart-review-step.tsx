'use client';

import { AlertCircle, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import { useCartStore } from '@/stores';
import { formatPrice } from '@/utils/format-price';

import type { CartItem } from '../types';

export function CartReviewStep() {
  const { items, updateItemQuantity, removeItem, nextStep } = useCheckout();
  const removeUnavailableItems = useCartStore((s) => s.removeUnavailableItems);
  const validateCart = useCartStore((s) => s.validateCart);

  useEffect(() => {
    validateCart();
  }, [validateCart]);

  const availableItems = items.filter((item) => item.isAvailable !== false);
  const unavailableItems = items.filter((item) => item.isAvailable === false);
  const hasUnavailable = unavailableItems.length > 0;

  const handleQuantityChange = (itemId: string, delta: number, current: number) => {
    const newQty = current + delta;
    if (newQty <= 0) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, newQty);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-navy">Review Your Cart</h2>
          {hasUnavailable && (
            <p className="text-xs text-rose-600 font-semibold mt-0.5">
              {unavailableItems.length} item(s) are currently unavailable and excluded from total.
            </p>
          )}
        </div>
        <span className="text-xs font-bold text-orange bg-orange/10 px-3 py-1 rounded-full">
          {availableItems.length} {availableItems.length === 1 ? 'Available' : 'Available'}
        </span>
      </div>

      {/* Top Banner for Unavailable Items */}
      {hasUnavailable && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-rose-950 text-xs sm:text-sm">
                Some items in your cart are currently unavailable
              </p>
              <p className="text-rose-700 text-[11px] sm:text-xs">
                Items marked as &quot;Currently unavailable&quot; have been excluded from your
                total. Remove them to proceed with your available items.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeUnavailableItems()}
            className="rounded-full border-rose-300 bg-white hover:bg-rose-100 text-rose-800 text-xs font-extrabold px-3.5 py-1.5 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Remove Unavailable Items
          </Button>
        </div>
      )}

      <div className="space-y-3.5 sm:space-y-4">
        {items.map((item: CartItem) => {
          const isUnavailable = item.isAvailable === false;

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-2xl border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between transition-all ${
                isUnavailable
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200/90 bg-slate-50/40 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 border ${
                    isUnavailable ? 'border-rose-200 opacity-60' : 'border-slate-200'
                  }`}
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      NAVYA
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-bold text-xs sm:text-sm md:text-base line-clamp-2 leading-tight ${
                      isUnavailable ? 'text-slate-500' : 'text-navy'
                    }`}
                  >
                    {item.name}
                  </p>
                  {Boolean(
                    (item as any).color || (item as any).size || (item as any).variantName,
                  ) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500 font-semibold mt-0.5">
                      {(item as any).color && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          Color: <strong>{(item as any).color}</strong>
                        </span>
                      )}
                      {(item as any).size && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          Size: <strong>{(item as any).size}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {isUnavailable ? (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        Currently unavailable
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                {isUnavailable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 cursor-pointer flex items-center gap-1"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <span>Remove</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-2xs">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border-slate-200 cursor-pointer ${
                        item.quantity <= 1
                          ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                      title={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                    >
                      {item.quantity <= 1 ? (
                        <Trash2 className="h-3 w-3 text-rose-600" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= 0) {
                          removeItem(item.id);
                        } else {
                          updateItemQuantity(item.id, val);
                        }
                      }}
                      className="w-10 sm:w-12 h-6 sm:h-7 text-center text-xs font-bold border-none p-0 focus:ring-0"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isUnavailable ? (
                    <div className="text-right">
                      <p className="text-xs line-through text-slate-400 font-mono">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <span className="text-[10px] text-rose-600 font-extrabold block">
                        Excluded from total
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm font-black text-navy text-right font-mono">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Visibility Brand Orange Action Button */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
        <Button
          type="button"
          onClick={nextStep}
          disabled={availableItems.length === 0}
          className={`w-full sm:w-auto rounded-full font-extrabold text-xs sm:text-sm md:text-base px-8 h-12 transition-all flex items-center justify-center gap-2 ${
            availableItems.length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-orange hover:bg-orange-hover text-white shadow-lg shadow-orange/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
          }`}
        >
          <span>
            {availableItems.length === 0
              ? 'No Available Items in Cart'
              : hasUnavailable
                ? 'Continue with Available Items'
                : 'Continue to Address'}
          </span>
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}
