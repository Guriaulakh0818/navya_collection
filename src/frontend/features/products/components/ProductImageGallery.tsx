'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import type { ProductImage } from '../types/product.types';

export const COLOR_FILTER_MAP: Record<string, { filter: string; hex: string; name: string }> = {
  red: { filter: 'hue-rotate(0deg) saturate(1.1)', hex: '#EF4444', name: 'Red' },
  blue: { filter: 'hue-rotate(200deg) saturate(1.3)', hex: '#2563EB', name: 'Royal Blue' },
  navy: {
    filter: 'hue-rotate(215deg) brightness(0.65) saturate(1.4)',
    hex: '#1E3A8A',
    name: 'Navy Blue',
  },
  green: { filter: 'hue-rotate(105deg) saturate(1.2)', hex: '#10B981', name: 'Emerald Green' },
  yellow: { filter: 'hue-rotate(45deg) saturate(1.4)', hex: '#F59E0B', name: 'Yellow' },
  gold: {
    filter: 'hue-rotate(40deg) saturate(1.5) brightness(1.05)',
    hex: '#D97706',
    name: 'Gold',
  },
  pink: { filter: 'hue-rotate(310deg) saturate(1.3)', hex: '#EC4899', name: 'Pink' },
  rose: { filter: 'hue-rotate(330deg) saturate(1.3)', hex: '#F43F5E', name: 'Rose Pink' },
  purple: { filter: 'hue-rotate(265deg) saturate(1.3)', hex: '#A855F7', name: 'Purple' },
  violet: { filter: 'hue-rotate(275deg) saturate(1.3)', hex: '#8B5CF6', name: 'Violet' },
  orange: { filter: 'hue-rotate(25deg) saturate(1.4)', hex: '#F97316', name: 'Orange' },
  peach: {
    filter: 'hue-rotate(20deg) saturate(1.2) brightness(1.1)',
    hex: '#FF8A65',
    name: 'Peach',
  },
  black: { filter: 'brightness(0.38) contrast(1.3) grayscale(0.8)', hex: '#111827', name: 'Black' },
  white: { filter: 'brightness(1.45) contrast(0.9) grayscale(0.9)', hex: '#F9FAFB', name: 'White' },
  maroon: {
    filter: 'hue-rotate(340deg) brightness(0.6) saturate(1.6)',
    hex: '#881337',
    name: 'Maroon',
  },
  wine: {
    filter: 'hue-rotate(330deg) brightness(0.55) saturate(1.6)',
    hex: '#4C0519',
    name: 'Wine Red',
  },
  cyan: { filter: 'hue-rotate(175deg) saturate(1.3)', hex: '#06B6D4', name: 'Cyan' },
  turquoise: { filter: 'hue-rotate(165deg) saturate(1.4)', hex: '#14B8A6', name: 'Turquoise' },
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  selectedColor?: string | null;
  className?: string;
};

export function ProductImageGallery({
  images,
  selectedColor,
  className,
}: ProductImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

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

  // Match selected color shade for real-time CSS filter transformation
  const colorKey = (selectedColor || '').toLowerCase().trim();
  const colorMatch =
    COLOR_FILTER_MAP[colorKey] ||
    Object.values(COLOR_FILTER_MAP).find((c) => colorKey.includes(c.name.toLowerCase()));
  const activeFilter = colorMatch ? colorMatch.filter : 'none';

  return (
    <div className="space-y-4">
      {/* Primary Display Image */}
      <div
        className={
          className ||
          'relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-slate-100 border border-slate-200 shadow-sm group'
        }
      >
        <Image
          src={activeImg.url}
          alt={activeImg.alt || 'Product image'}
          fill
          style={{ filter: activeFilter }}
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
        />

        {/* Live Color Shade Badge */}
        {colorMatch && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 z-10 transition-all animate-in fade-in zoom-in-95 duration-200">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0"
              style={{ backgroundColor: colorMatch.hex }}
            />
            <span className="text-[11px] font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {selectedColor || colorMatch.name} Shade Preview
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                activeIdx === idx
                  ? 'border-navy shadow-md scale-95 ring-2 ring-navy/20'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `Thumbnail ${idx + 1}`}
                fill
                style={{ filter: activeFilter }}
                className="object-cover transition-all duration-300"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
