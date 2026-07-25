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
    <div className="group relative rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/30 flex items-center justify-center p-4">
            <span className="font-heading text-xl font-bold text-navy/30 text-center uppercase tracking-wider">
              {product.name}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {discount ? <ProductBadge type="sale" text={`${discount}% OFF`} /> : null}
          {product.isNewArrival ? <ProductBadge type="new" text="NEW" /> : null}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton product={product} />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {product.category?.name || 'Garments'}
          </p>
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-heading text-base font-semibold text-slate-900 group-hover:text-orange transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center justify-between">
            <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} />
          </div>

          <div className="mt-2">
            <ProductRating rating={product.rating ?? 4.5} reviewCount={product.reviewCount ?? 12} />
          </div>
        </div>

        <div className="mt-4 pt-2">
          <AddToCartButton
            product={product}
            className="w-full rounded-full text-xs font-bold py-2.5"
          />
        </div>
      </div>
    </div>
  );
}
