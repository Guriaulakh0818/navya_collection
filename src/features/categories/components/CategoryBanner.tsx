import type { Category } from '../types/category.types';

type CategoryBannerProps = {
  category: Category;
};

export function CategoryBanner({ category }: CategoryBannerProps) {
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br ${category.accent || 'from-navy to-[#234b8f]'} py-16 text-white`}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="mt-4 text-lg text-white/80">{category.description}</p>
          )}
          {typeof category.productCount === 'number' && (
            <p className="mt-2 text-sm text-white/70">{category.productCount} products</p>
          )}
        </div>
      </div>
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-10 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
}
