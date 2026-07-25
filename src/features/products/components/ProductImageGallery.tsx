import Image from 'next/image';

import type { ProductImage } from '../types/product.types';

type ProductImageGalleryProps = {
  images: ProductImage[];
  className?: string;
};

export function ProductImageGallery({ images, className }: ProductImageGalleryProps) {
  const primary = images.find((img) => img.isPrimary) || images[0];

  if (!primary) {
    return (
      <div className={className || 'aspect-[3/4] bg-gradient-to-br from-sky-50 to-orange-50'} />
    );
  }

  return (
    <div className={className || 'relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100'}>
      <Image
        src={primary.url}
        alt={primary.alt || 'Product image'}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
      />
    </div>
  );
}
