'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types/product.types';
import { useCartStore } from '@/stores';

type AddToCartButtonProps = {
  product: Product;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function AddToCartButton({ product, className, disabled, compact }: AddToCartButtonProps) {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!product?.id) return null;

  // Check if product is currently in cart
  const cartItem = mounted ? items.find((item) => item.productId === product.id) : undefined;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const imgUrl =
      (product as any).image ||
      product.images?.find((i: any) => i.isPrimary)?.imageUrl ||
      product.images?.find((i: any) => i.isPrimary)?.url ||
      product.images?.[0]?.imageUrl ||
      product.images?.[0]?.url;

    const shopInfo = (product as any).shop || {};

    await addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price || 0),
      quantity: 1,
      image: imgUrl,
      shopId: shopInfo.id || 'navya-boutique',
      shopName: shopInfo.name || 'Navya Collection Boutique',
      shopSlug: shopInfo.slug || 'navya-collection',
      shopLogo: shopInfo.logo,
    });
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    await updateQuantity(cartItem.id, cartItem.quantity + 1);
  };

  // If item is already in cart, show interactive quantity controller box in theme colors
  if (cartItem && cartItem.quantity > 0) {
    if (compact) {
      return (
        <div
          className={`inline-flex items-center justify-between rounded-lg sm:rounded-xl bg-navy text-white px-1 py-0.5 border border-navy-700 shadow-2xs h-7 sm:h-8 shrink-0 ${className || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDecrease}
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
          </button>

          <span className="font-heading text-[11px] sm:text-xs font-black text-white px-1.5 select-none tracking-wider">
            {cartItem.quantity}
          </span>

          <button
            onClick={handleIncrease}
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-orange hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            aria-label="Increase quantity"
            title="Increase quantity"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`w-full flex items-center justify-between rounded-xl bg-navy text-white px-1 py-0.5 border border-navy-700 shadow-sm h-8 sm:h-9 ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDecrease}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          <Minus className="h-3 w-3 stroke-[3]" />
        </button>

        <span className="font-heading text-xs sm:text-sm font-black text-white px-2 select-none tracking-wider">
          {cartItem.quantity}
        </span>

        <button
          onClick={handleIncrease}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-orange hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3 stroke-[3]" />
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-orange hover:bg-orange-600 text-white font-extrabold text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className || ''}`}
        onClick={handleAddToCart}
        disabled={disabled}
        aria-label={`Add ${product.name} to cart`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
        <span>Add</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`w-full rounded-xl bg-orange hover:bg-orange-600 text-white font-bold text-[11px] sm:text-xs h-8 sm:h-9 py-1.5 px-3 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      onClick={handleAddToCart}
      disabled={disabled}
    >
      Add to Cart
    </button>
  );
}
