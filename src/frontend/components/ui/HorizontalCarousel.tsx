'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface HorizontalCarouselProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionLink?: string;
  actionText?: string;
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function HorizontalCarousel({
  title,
  subtitle,
  icon,
  actionLink,
  actionText = 'View All',
  children,
  className = '',
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      }
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className={`space-y-4 relative group ${className}`}>
      {/* Section Header */}
      {title && (
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg sm:text-xl font-extrabold text-navy tracking-tight">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop & Mobile Arrow Navigation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 shadow-xs transition-all ${
                  canScrollLeft
                    ? 'hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 cursor-pointer active:scale-95'
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 shadow-xs transition-all ${
                  canScrollRight
                    ? 'hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 cursor-pointer active:scale-95'
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {actionLink && (
              <Link
                href={actionLink}
                className="text-xs text-amber-700 font-extrabold flex items-center gap-1 hover:text-amber-600 transition-colors shrink-0 ml-1"
              >
                <span>{actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Carousel Items Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}
