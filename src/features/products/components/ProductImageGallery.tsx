'use client';

import { useState } from 'react';
import Image from 'next/image';

import type { ProductImage } from '../types/product.types';

type ProductImageGalleryProps = {
  images: ProductImage[];
  className?: string;
};

export function ProductImageGallery({ images, className }: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        className={
          className ||
          'relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50 flex items-center justify-center p-8 border border-slate-200'
        }
      >
        <div className="text-center space-y-2">
          <span className="font-heading text-2xl font-bold text-navy/40 uppercase tracking-widest block">
            NAVYA
          </span>
          <span className="text-xs text-slate-400 font-medium">Premium Fashion Image</span>
        </div>
      </div>
    );
  }

  const activeImg = images[activeIdx] || images[0];

  return (
    <div className="space-y-4">
      {/* Primary Display Image */}
      <div
        className={
          className ||
          'relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-slate-100 border border-slate-200/80 shadow-md group'
        }
      >
        <Image
          src={activeImg.url}
          alt={activeImg.alt || 'Product image'}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
        />
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                activeIdx === idx
                  ? 'border-navy shadow-md scale-95'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
