'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { Product } from '@/features/products/types/product.types';
import { useToast } from '@/providers';
import { useWishlistStore } from '@/stores';

export type WishlistButtonProps = {
  product: Product | any;
  variant?: any;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  showToast?: boolean;
};

export function WishlistButton({
  product,
  variant,
  className,
  iconClassName,
  size = 'md',
  showLabel = false,
  activeLabel = 'Wishlisted',
  inactiveLabel = 'Add to Wishlist',
  showToast = true,
}: WishlistButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const pid = product?.id || product?.productId || '';
  const vid = variant?.id || null;

  const isInWishlist = useWishlistStore((s) => (pid ? s.isInWishlist(pid, vid) : false));
  const addItem = useWishlistStore((s) => s.addItem);
  const removeItem = useWishlistStore((s) => s.removeItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pid) return null;

  const activeInWishlist = mounted && isInWishlist;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeInWishlist) {
      await removeItem(pid, vid);
      if (showToast) {
        toast(`Removed ${product.name || 'item'} from your wishlist.`, 'info');
      }
    } else {
      const selectedSize =
        variant?.size ||
        variant?.sizeName ||
        (typeof variant?.attributes === 'object' ? variant?.attributes?.size : null) ||
        null;

      const selectedColor =
        variant?.color ||
        variant?.colorName ||
        (typeof variant?.attributes === 'object' ? variant?.attributes?.color : null) ||
        null;

      const variantName = variant?.name || null;

      const itemPrice = Number(variant?.price ?? product?.price ?? 0);
      const comparePrice = variant?.compareAtPrice
        ? Number(variant.compareAtPrice)
        : product?.compareAtPrice
          ? Number(product.compareAtPrice)
          : null;

      const image =
        variant?.imageUrl ||
        variant?.image ||
        product?.images?.[0]?.imageUrl ||
        product?.images?.[0]?.url ||
        product?.image ||
        '';

      await addItem({
        productId: pid,
        variantId: vid,
        name: product?.name || 'Navya Couture',
        slug: product?.slug || '',
        price: itemPrice,
        compareAtPrice: comparePrice,
        image,
        inStock: (variant?.stock ?? product?.stock ?? 1) > 0,
        categoryName: product?.category?.name || product?.categoryName || null,
        shopId: product?.shop?.id || product?.shopId,
        shopName: product?.shop?.name || product?.shopName,
        shopSlug: product?.shop?.slug || product?.shopSlug,
        shopLogo: product?.shop?.logo || product?.shopLogo,
        selectedSize,
        selectedColor,
        variantName,
      });

      if (showToast) {
        const variantSuffix = [selectedColor, selectedSize].filter(Boolean).join(', ');
        toast(
          `Added ${product.name || 'item'}${variantSuffix ? ` (${variantSuffix})` : ''} to wishlist! ❤️`,
          'success',
        );
      }
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  }[size];

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 transform cursor-pointer select-none ${
        activeInWishlist
          ? 'bg-rose-50 text-rose-600 scale-105 shadow-sm'
          : 'bg-white/80 text-slate-600 hover:text-rose-600 hover:bg-white shadow-2xs'
      } ${sizeClasses} ${className || ''}`}
      aria-label={activeInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={activeInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`transition-transform duration-200 ${iconSizes} ${
          activeInWishlist ? 'fill-rose-600 text-rose-600 scale-110' : 'text-current'
        } ${iconClassName || ''}`}
      />
      {showLabel && (
        <span className="ml-1.5 font-bold">{activeInWishlist ? activeLabel : inactiveLabel}</span>
      )}
    </button>
  );
}
