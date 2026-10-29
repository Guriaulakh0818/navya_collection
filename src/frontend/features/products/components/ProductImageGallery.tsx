'use client';

import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import type { ProductImage } from '../types/product.types';

type ProductImageGalleryProps = {
  images: ProductImage[];
  activeImageUrl?: string;
  className?: string;
  renderOverlay?: React.ReactNode;
};

const getImgSrc = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img.trim();
  return (img.url || img.imageUrl || img.secureUrl || '').trim();
};

export function ProductImageGallery({
  images,
  activeImageUrl,
  className,
  renderOverlay,
}: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Automatically sync active image when a variant with a photo is selected
  useEffect(() => {
    if (activeImageUrl && images && images.length > 0) {
      const foundIdx = images.findIndex((img) => getImgSrc(img) === activeImageUrl.trim());
      if (foundIdx !== -1) {
        setActiveIdx(foundIdx);
      }
    }
  }, [activeImageUrl, images]);

  if (!images || images.length === 0) {
    return (
      <div
        className={
          className ||
          'relative aspect-[3/4] w-full max-w-[440px] max-h-[520px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/20 flex items-center justify-center p-8 border border-slate-200'
        }
      >
        <div className="text-center space-y-2">
          <span className="font-heading text-2xl font-bold text-navy/40 uppercase tracking-widest block">
            JIIVAAKART
          </span>
          <span className="text-xs text-slate-400 font-medium">Premium Fashion Image</span>
        </div>
      </div>
    );
  }

  const activeImg = images[activeIdx] || images[0];
  const activeSrc = getImgSrc(activeImg);
  const isCurrentFailed = !activeSrc || Boolean(failedUrls[activeSrc]);

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
    <div className="space-y-2 sm:space-y-3 select-none">
      {/* Primary Display Image with Touch Swipe & Arrow Controls */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={
          className ||
          'relative aspect-[3/4] w-full max-w-[420px] lg:max-w-[450px] xl:max-w-[480px] max-h-[480px] sm:max-h-[520px] lg:max-h-[550px] mx-auto overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 shadow-sm group touch-pan-y'
        }
      >
        {!isCurrentFailed ? (
          <Image
            src={activeSrc}
            alt={activeImg.alt || 'Product image'}
            fill
            unoptimized={true}
            onError={() => {
              if (activeSrc) {
                setFailedUrls((prev) => ({ ...prev, [activeSrc]: true }));
              }
            }}
            className="object-cover object-top transition-all duration-500 group-hover:scale-105 select-none overflow-hidden [text-indent:-9999px]"
            sizes="(min-width: 1024px) 35vw, 100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/20 flex flex-col items-center justify-center p-6 text-center">
            <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
            <span className="font-heading text-lg font-bold text-navy/50 uppercase tracking-widest block">
              JIIVAAKART
            </span>
            <span className="text-[11px] text-slate-400 mt-1 font-medium">
              Image preview loading or unavailable
            </span>
          </div>
        )}

        {/* Floating Custom Overlay (e.g. Wishlist button pinned directly to photo) */}
        {renderOverlay}

        {/* Previous Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 sm:p-2.5 text-navy shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer z-10"
            aria-label="Previous product image"
            title="Previous image"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Next Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 sm:p-2.5 text-navy shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer z-10"
            aria-label="Next product image"
            title="Next image"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-full bg-navy/80 backdrop-blur-xs px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-extrabold text-white shadow-xs z-10 tracking-wider">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Touch Scrollable Thumbnail Bar */}
      {images.length > 1 && (
        <div className="relative max-w-[420px] lg:max-w-[450px] xl:max-w-[480px] mx-auto">
          <div
            ref={thumbnailRef}
            className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((img, idx) => {
              const thumbSrc = getImgSrc(img);
              const isThumbFailed = !thumbSrc || Boolean(failedUrls[thumbSrc]);

              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`relative h-13 w-13 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer snap-start ${
                    activeIdx === idx
                      ? 'border-navy shadow-md scale-95 ring-2 ring-navy/30 opacity-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  {!isThumbFailed ? (
                    <Image
                      src={thumbSrc}
                      alt={img.alt || `Thumbnail ${idx + 1}`}
                      fill
                      unoptimized={true}
                      onError={() => {
                        if (thumbSrc) {
                          setFailedUrls((prev) => ({ ...prev, [thumbSrc]: true }));
                        }
                      }}
                      className="object-cover object-top transition-all duration-300 select-none overflow-hidden [text-indent:-9999px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
