'use client';

import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types/product.types';
import { useCartStore } from '@/stores';

type AddToCartButtonProps = {
  product: Product;
  className?: string;
  disabled?: boolean;
};

export function AddToCartButton({ product, className, disabled }: AddToCartButtonProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // Check if product is currently in cart
  const cartItem = items.find((item) => item.productId === product.id);

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
      price: product.price,
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
    return (
      <div
        className={`w-full flex items-center justify-between rounded-full bg-navy text-white p-1 border border-navy-700 shadow-md ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDecrease}
          className="h-7 w-7 rounded-full bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5 stroke-[3]" />
        </button>

        <span className="font-heading text-sm font-black text-white px-3 select-none tracking-wider">
          {cartItem.quantity}
        </span>

        <button
          onClick={handleIncrease}
          className="h-7 w-7 rounded-full bg-orange hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`w-full rounded-full bg-orange hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      onClick={handleAddToCart}
      disabled={disabled}
    >
      Add to Cart
    </button>
  );
}
