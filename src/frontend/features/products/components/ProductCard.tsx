'use client';

import { useMemo, useState } from 'react';
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
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const defaultImageSrc =
    (primaryImage as any)?.url ||
    (primaryImage as any)?.imageUrl ||
    (typeof primaryImage === 'string' ? primaryImage : undefined) ||
    (product as any)?.imageUrl ||
    (product as any)?.image;

  const imageSrc = hoveredImage || defaultImageSrc;

  // Extract distinct color variations with photos
  const colorVariants = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return [];
    const seen = new Set<string>();
    const list: { color: string; imageUrl?: string }[] = [];
    for (const v of product.variants) {
      const c = (v.color || (v as any).colorName)?.trim();
      const img = v.imageUrl || (v as any).image || (v.attributes as any)?.imageUrl;
      if (c && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        list.push({ color: c, imageUrl: img });
      }
    }
    return list;
  }, [product.variants]);

  return (
    <div className="group relative rounded-2xl bg-brand-surface border border-brand-border shadow-card hover:shadow-premium transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-brand-divider block cursor-pointer select-none"
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={(primaryImage as any)?.alt || (primaryImage as any)?.altText || product.name}
            fill
            unoptimized={true}
            className="object-cover group-hover:scale-105 transition-transform duration-500 select-none overflow-hidden [text-indent:-9999px]"
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

          {/* Color Variation Thumbnails Preview */}
          {colorVariants.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              {colorVariants.slice(0, 5).map((cv, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => cv.imageUrl && setHoveredImage(cv.imageUrl)}
                  onMouseLeave={() => setHoveredImage(null)}
                  className={`w-5 h-6 rounded-md overflow-hidden border transition-transform hover:scale-110 shrink-0 ${
                    hoveredImage === cv.imageUrl
                      ? 'border-amber-500 ring-1 ring-amber-500'
                      : 'border-slate-200'
                  }`}
                  title={cv.color}
                >
                  {cv.imageUrl ? (
                    <img src={cv.imageUrl} alt={cv.color} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full bg-slate-200 text-[8px] flex items-center justify-center font-bold text-slate-600">
                      {cv.color.charAt(0)}
                    </span>
                  )}
                </button>
              ))}
              {colorVariants.length > 5 && (
                <span className="text-[10px] font-bold text-slate-400">
                  +{colorVariants.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} />
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <ProductRating rating={product.rating} reviewCount={product.reviewCount} />
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
