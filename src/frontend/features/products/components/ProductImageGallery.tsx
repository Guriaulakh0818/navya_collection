'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import Image from 'next/image';

import type { ProductImage } from '../types/product.types';

type ProductImageGalleryProps = {
  images: ProductImage[];
  className?: string;
};

export function ProductImageGallery({ images, className }: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div
        className={
          className ||
          'relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50 flex items-center justify-center p-8 border border-slate-200'
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

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  // Mobile Swipe Gesture Handlers
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      handleNext();
    } else if (isRightSwipe && images.length > 1) {
      handlePrev();
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Primary Display Image with Touch Swipe & Arrow Controls */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={
          className ||
          'relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-slate-100 border border-slate-200 shadow-sm group touch-pan-y'
        }
      >
        <Image
          src={activeImg.url}
          alt={activeImg.alt || 'Product image'}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-105 select-none overflow-hidden [text-indent:-9999px]"
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
        />

        {/* Previous Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer z-10"
            aria-label="Previous product image"
            title="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-navy shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer z-10"
            aria-label="Next product image"
            title="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-navy/80 backdrop-blur-xs px-3 py-1 text-[11px] font-extrabold text-white shadow-xs z-10 tracking-wider">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Touch Scrollable Thumbnail Bar */}
      {images.length > 1 && (
        <div className="relative">
          <div
            ref={thumbnailRef}
            className="flex items-center gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer snap-start ${
                  activeIdx === idx
                    ? 'border-navy shadow-md scale-95 ring-2 ring-navy/30 opacity-100'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover transition-all duration-300 select-none overflow-hidden [text-indent:-9999px]"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
