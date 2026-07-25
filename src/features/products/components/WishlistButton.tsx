'use client';

import type { Product } from '@/features/products/types/product.types';
import { useWishlistStore } from '@/stores';

type WishlistButtonProps = {
  product: Product;
  className?: string;
};

export function WishlistButton({ product, className }: WishlistButtonProps) {
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      slug: product.slug,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-full p-2 transition-colors ${
        isInWishlist ? 'bg-error/10 text-error' : 'bg-white/80 text-slate-600 hover:text-error'
      } ${className || ''}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={isInWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06 1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
