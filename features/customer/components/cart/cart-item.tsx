'use client';

import { CartItem } from '../../lib/types';

type CartItemProps = {
  item: CartItem & { product: { name: string; price: number; image?: string } };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-premium sm:flex-row sm:items-center">
      <div className="h-20 w-20 shrink-0 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50" />
      <div className="flex-1">
        <h4 className="font-heading text-lg text-navy">{item.product.name}</h4>
        <p className="text-sm text-slate-600">₹{item.product.price.toLocaleString('en-IN')}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm font-bold text-navy"
        >
          -
        </button>
        <span className="text-sm font-semibold text-navy">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm font-bold text-navy"
        >
          +
        </button>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="text-sm font-medium text-error hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
