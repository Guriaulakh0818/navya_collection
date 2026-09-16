import Image from 'next/image';
import type { Category } from '../types/category.types';

type CategoryBannerProps = {
  category: Category;
};

export function CategoryBanner({ category }: CategoryBannerProps) {
  const bannerSrc = category.banner || category.image;

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br ${category.accent || 'from-navy to-[#234b8f]'} py-12 md:py-16 text-white`}
    >
      {bannerSrc && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 md:w-1/2 opacity-35 sm:opacity-45 pointer-events-none">
          <Image
            src={bannerSrc}
            alt={category.name}
            fill
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#183A73] via-[#183A73]/80 to-transparent sm:block hidden" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-xs">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium max-w-xl">
              {category.description}
            </p>
          )}
          {typeof category.productCount === 'number' && (
            <p className="text-xs sm:text-sm text-amber-300 font-semibold">
              {category.productCount > 0 ? `${category.productCount} products` : 'Curated Collection ✨'}
            </p>
          )}
        </div>
      </div>

      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
    </section>
  );
}
