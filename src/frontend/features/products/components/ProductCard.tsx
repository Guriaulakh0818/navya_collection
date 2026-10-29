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
  const [hasImgError, setHasImgError] = useState(false);
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
    <div className="group relative rounded-xl sm:rounded-2xl bg-brand-surface border border-brand-border shadow-card hover:shadow-premium transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        prefetch={true}
        className="relative aspect-[4/5] w-full overflow-hidden bg-brand-divider block cursor-pointer select-none"
      >
        {imageSrc && !hasImgError ? (
          <Image
            src={imageSrc}
            alt={(primaryImage as any)?.alt || (primaryImage as any)?.altText || product.name}
            fill
            unoptimized={true}
            onError={() => setHasImgError(true)}
            className="object-cover group-hover:scale-105 transition-transform duration-500 select-none overflow-hidden [text-indent:-9999px]"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-divider via-brand-background to-orange/10 flex items-center justify-center p-3">
            <span className="font-heading text-base sm:text-lg font-bold text-navy/30 text-center uppercase tracking-wider">
              {product.name}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
          {discount ? (
            <ProductBadge
              type="sale"
              text={`${discount}% OFF`}
              className="text-[9px] px-1.5 py-0.5 font-black tracking-tight"
            />
          ) : null}
          {product.isNewArrival ? (
            <ProductBadge
              type="new"
              text="NEW"
              className="text-[9px] px-1.5 py-0.5 font-black tracking-tight"
            />
          ) : null}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
          <WishlistButton
            product={product}
            className="p-1 sm:p-1.5 bg-white/90 shadow-2xs hover:bg-white"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5 bg-white">
        <div>
          <Link href={`/product/${product.slug}`} prefetch={true}>
            <h3 className="font-bold text-navy text-xs sm:text-sm group-hover:text-orange transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Color Variation Thumbnails Preview */}
          {colorVariants.length > 1 && (
            <div className="mt-1 flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {colorVariants.slice(0, 4).map((cv, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => cv.imageUrl && setHoveredImage(cv.imageUrl)}
                  onMouseLeave={() => setHoveredImage(null)}
                  className={`w-4 h-5 rounded-md overflow-hidden border transition-transform hover:scale-110 shrink-0 ${
                    hoveredImage === cv.imageUrl
                      ? 'border-orange ring-1 ring-orange'
                      : 'border-slate-200'
                  }`}
                  title={cv.color}
                >
                  {cv.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cv.imageUrl}
                      alt={cv.color}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full h-full bg-slate-200 text-[8px] flex items-center justify-center font-bold text-slate-600">
                      {cv.color.charAt(0)}
                    </span>
                  )}
                </button>
              ))}
              {colorVariants.length > 4 && (
                <span className="text-[9px] font-bold text-slate-400">
                  +{colorVariants.length - 4}
                </span>
              )}
            </div>
          )}

          {product.rating ? (
            <div className="mt-1 flex items-center justify-between">
              <ProductRating
                rating={product.rating}
                reviewCount={product.reviewCount}
                className="flex items-center gap-1 text-[10px] text-slate-400 font-medium"
              />
            </div>
          ) : null}

          {/* Price & Add to Cart Inline Row */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <ProductPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap text-xs sm:text-sm font-black"
              />
            </div>

            <div className="shrink-0">
              <AddToCartButton product={product} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
