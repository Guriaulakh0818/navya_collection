'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

import { getOptimizedImageUrl } from '@/lib/cloudinary';

export interface CloudinaryImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  crop?: string;
  fallbackSrc?: string;
  className?: string;
}

/**
 * CloudinaryImage Component
 *
 * Renders high-performance responsive images using Next.js Image component integrated with Cloudinary auto-format & quality transformations.
 */
export const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  crop,
  fallbackSrc = '/images/default-shop-banner.png',
  className = '',
  fill,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getOptimizedImageUrl(src, { width, height, crop, quality: quality.toString() }),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  return (
    <div className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''} ${className}`}>
      <Image
        src={imgSrc || fallbackSrc}
        alt={alt}
        width={fill ? undefined : width || 800}
        height={fill ? undefined : height || 1000}
        fill={fill}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        className={`transition-all duration-300 ${
          isLoading ? 'scale-105 blur-sm opacity-70' : 'scale-100 blur-0 opacity-100'
        } ${fill ? 'object-cover' : ''}`}
        {...props}
      />
    </div>
  );
};
