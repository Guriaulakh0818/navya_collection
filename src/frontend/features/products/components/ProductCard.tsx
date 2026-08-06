'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '../types/product.types';
import { calculateDiscount } from '../utils/product.utils';
import { AddToCartButton } from './AddToCartButton';
import { ProductBadge } from './ProductBadge';
import { ProductPrice } from './ProductPrice';
import { ProductRating } from './ProductRating';
import { WishlistButton } from './WishlistButton';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  return (
    <div className="group relative rounded-2xl bg-brand-surface border border-brand-border shadow-card hover:shadow-premium transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-brand-divider block cursor-pointer"
      >
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-divider via-brand-background to-orange/10 flex items-center justify-center p-4">
            <span className="font-heading text-xl font-bold text-navy/30 text-center uppercase tracking-wider">
              {product.name}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {discount ? <ProductBadge type="sale" text={`${discount}% OFF`} /> : null}
          {product.isNewArrival ? <ProductBadge type="new" text="NEW" /> : null}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
          <WishlistButton product={product} />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            <span>{product.category?.name || 'Garments'}</span>
            <span className="text-amber-700 font-semibold lowercase">
              {product.shop?.name ? `by ${product.shop.name}` : 'Local Shop'}
            </span>
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="font-extrabold text-navy text-sm sm:text-base group-hover:text-amber-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center justify-between">
            <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} />
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <ProductRating rating={product.rating ?? 4.8} reviewCount={product.reviewCount ?? 24} />
          </div>
        </div>

        <div className="pt-2">
          <AddToCartButton
            product={product}
            className="w-full rounded-xl text-xs font-extrabold py-2.5 shadow-xs"
          />
        </div>
      </div>
    </div>
  );
}
