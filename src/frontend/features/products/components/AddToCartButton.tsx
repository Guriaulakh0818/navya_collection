'use client';

import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Product } from '@/features/products/types/product.types';
import { useToast } from '@/providers';
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
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find all cart items matching this product
  const matchingCartItems = useMemo(() => {
    if (!mounted || !product?.id) return [];
    return items.filter((item) => item.productId === product.id);
  }, [items, product?.id, mounted]);

  const cartItem = matchingCartItems[0];
  const currentQuantity = matchingCartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Target variant resolution: if in cart, use the variant in cart; otherwise default to first in-stock variant
  const defaultVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    if (cartItem?.variantId) {
      const match = product.variants.find((v) => v.id === cartItem.variantId);
      if (match) return match;
    }
    return product.variants.find((v) => (v.stock ?? 1) > 0) || product.variants[0];
  }, [product?.variants, cartItem?.variantId]);

  // Determine realistic available stock
  const rawStock = defaultVariant?.stock ?? product?.stock;
  // Maximum allowed per item: actual stock, capped at a maximum of 10 for consumer protection
  const maxStock = useMemo(() => {
    if (cartItem?.availableStock && cartItem.availableStock > 0) {
      return Math.min(cartItem.availableStock, 10);
    }
    if (typeof rawStock === 'number') {
      return rawStock > 0 ? Math.min(rawStock, 10) : 0;
    }
    return 10;
  }, [cartItem?.availableStock, rawStock]);

  const isOutOfStock = Boolean(
    product?.stock !== undefined &&
    product.stock <= 0 &&
    (!product?.variants ||
      product.variants.length === 0 ||
      product.variants.every((v) => (v.stock ?? 0) <= 0)),
  );

  const isMaxReached = currentQuantity >= maxStock;

  if (!product?.id) return null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast?.('This item is currently out of stock.', 'error');
      return;
    }

    const imgUrl =
      defaultVariant?.imageUrl ||
      defaultVariant?.image ||
      (product as any).image ||
      product.images?.find((i: any) => i.isPrimary)?.imageUrl ||
      product.images?.find((i: any) => i.isPrimary)?.url ||
      product.images?.[0]?.imageUrl ||
      product.images?.[0]?.url;

    const shopInfo = (product as any).shop || {};

    const price = Number(defaultVariant?.price ?? product.price ?? 0);
    const compareAtPrice = defaultVariant?.compareAtPrice
      ? Number(defaultVariant.compareAtPrice)
      : product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null;

    const variantName = defaultVariant
      ? defaultVariant.name ||
        `${defaultVariant.color || ''} ${defaultVariant.size || ''}`.trim() ||
        null
      : null;

    await addItem({
      productId: product.id,
      variantId: defaultVariant?.id || null,
      name: variantName ? `${product.name} - ${variantName}` : product.name,
      productName: product.name,
      productSlug: product.slug,
      variantName: variantName,
      size: defaultVariant?.size || null,
      color: defaultVariant?.color || null,
      sku: defaultVariant?.sku || product.sku,
      price: price,
      compareAtPrice: compareAtPrice,
      quantity: 1,
      availableStock: maxStock,
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

    if (currentQuantity <= 1) {
      await removeItem(cartItem.id, cartItem.variantId);
    } else {
      // If previous quantity was inflated beyond maxStock (e.g. 62), clamp down to maxStock - 1
      const targetQty = currentQuantity > maxStock ? maxStock - 1 : currentQuantity - 1;
      await updateQuantity(cartItem.id, Math.max(1, targetQty));
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;

    if (isMaxReached) {
      toast?.(`Maximum purchase limit of ${maxStock} items reached for this product.`, 'info');
      return;
    }

    await updateQuantity(cartItem.id, currentQuantity + 1);
  };

  // If item is already in cart, show interactive quantity controller
  if (cartItem && currentQuantity > 0) {
    if (compact) {
      return (
        <div
          className={`inline-flex items-center justify-between rounded-lg sm:rounded-xl bg-navy text-white px-1 py-0.5 border border-navy-700 shadow-2xs h-7 sm:h-8 shrink-0 ${className || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleDecrease}
            className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
          </button>

          <span className="font-heading text-[11px] sm:text-xs font-black text-white px-1.5 select-none tracking-wider">
            {currentQuantity}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={isMaxReached}
            className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md text-white flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-2xs ${
              isMaxReached
                ? 'opacity-35 cursor-not-allowed bg-slate-600'
                : 'bg-orange hover:bg-orange-600 cursor-pointer'
            }`}
            aria-label="Increase quantity"
            title={isMaxReached ? `Maximum limit of ${maxStock} reached` : 'Increase quantity'}
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
          type="button"
          onClick={handleDecrease}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-navy-600 hover:bg-orange text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="Decrease quantity"
          title="Decrease quantity"
        >
          <Minus className="h-3 w-3 stroke-[3]" />
        </button>

        <span className="font-heading text-xs sm:text-sm font-black text-white px-2 select-none tracking-wider">
          {currentQuantity}
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={isMaxReached}
          className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-white flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-xs ${
            isMaxReached
              ? 'opacity-35 cursor-not-allowed bg-slate-600'
              : 'bg-orange hover:bg-orange-600 cursor-pointer'
          }`}
          aria-label="Increase quantity"
          title={isMaxReached ? `Maximum limit of ${maxStock} reached` : 'Increase quantity'}
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
        disabled={disabled || isOutOfStock}
        aria-label={`Add ${product.name} to cart`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
        <span>{isOutOfStock ? 'Out of Stock' : 'Add'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`w-full rounded-xl bg-orange hover:bg-orange-600 text-white font-bold text-[11px] sm:text-xs h-8 sm:h-9 py-1.5 px-3 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
      onClick={handleAddToCart}
      disabled={disabled || isOutOfStock}
    >
      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
}
