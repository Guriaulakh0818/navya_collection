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
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-navy">Review Your Cart</h2>
          {hasUnavailable && (
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
              {unavailableItems.length} item(s) are currently unavailable and excluded from total.
            </p>
          )}
        </div>
        <span className="text-[11px] font-bold text-orange bg-orange/10 px-2.5 py-0.5 rounded-full">
          {availableItems.length} Available
        </span>
      </div>

      {/* Top Banner for Unavailable Items */}
      {hasUnavailable && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-rose-950 text-xs">
                Some items in your cart are currently unavailable
              </p>
              <p className="text-rose-700 text-[11px]">
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
            className="rounded-full border-rose-300 bg-white hover:bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Remove Unavailable Items
          </Button>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2 sm:space-y-2.5">
        {items.map((item: CartItem) => {
          const isUnavailable = item.isAvailable === false;

          return (
            <div
              key={item.id}
              className={`flex flex-row items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border p-2 sm:p-2.5 sm:px-3 transition-all ${
                isUnavailable
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200/90 bg-slate-50/40 hover:border-slate-300'
              }`}
            >
              {/* Left Side: Product Image + Title & Unit Price */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className={`relative h-11 w-11 sm:h-13 sm:w-13 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border ${
                    isUnavailable ? 'border-rose-200 opacity-60' : 'border-slate-200'
                  }`}
                >
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                      NAVYA
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-bold text-xs sm:text-sm truncate leading-snug ${
                      isUnavailable ? 'text-slate-500' : 'text-navy'
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  {Boolean(
                    (item as any).color || (item as any).size || (item as any).variantName,
                  ) && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 font-medium">
                      {(item as any).color && (
                        <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-700">
                          {(item as any).color}
                        </span>
                      )}
                      {(item as any).size && (
                        <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-700">
                          {(item as any).size}
                        </span>
                      )}
                    </div>
                  )}

                  {isUnavailable ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                      <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                      Unavailable
                    </span>
                  ) : (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Quantity Stepper + Total Price + Delete Button */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {isUnavailable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-1 cursor-pointer flex items-center gap-1 h-7"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3 text-rose-600" />
                    <span>Remove</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-full border border-slate-200 shadow-2xs">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full border-slate-200 cursor-pointer ${
                        item.quantity <= 1
                          ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                      title={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
                    >
                      {item.quantity <= 1 ? (
                        <Trash2 className="h-2.5 w-2.5 text-rose-600" />
                      ) : (
                        <Minus className="h-2.5 w-2.5" />
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
                      className="w-6 sm:w-7 h-5 sm:h-6 text-center text-[11px] sm:text-xs font-bold border-none p-0 focus:ring-0 font-mono"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                )}

                {!isUnavailable && (
                  <p className="text-xs sm:text-sm font-black text-navy text-right font-mono min-w-[48px] sm:min-w-[56px]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                )}

                {!isUnavailable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer p-0 shrink-0"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Visibility Brand Orange Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
        <Button
          type="button"
          onClick={nextStep}
          disabled={availableItems.length === 0}
          className={`w-full sm:w-auto rounded-full font-extrabold text-xs sm:text-sm px-6 h-10 sm:h-11 transition-all flex items-center justify-center gap-2 ${
            availableItems.length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-orange hover:bg-orange-hover text-white shadow-md shadow-orange/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
          }`}
        >
          <span>
            {availableItems.length === 0
              ? 'No Available Items in Cart'
              : hasUnavailable
                ? 'Continue with Available Items'
                : 'Continue to Address'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
