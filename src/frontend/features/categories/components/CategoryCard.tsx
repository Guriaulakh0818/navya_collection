import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import type { Category } from '../types/category.types';

type CategoryCardProps = {
  category: Category;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="group relative overflow-hidden border-0 shadow-sm transition-transform hover:scale-[1.02]">
        <div
          className={`relative aspect-[4/5] bg-gradient-to-br ${category.accent || 'from-navy to-[#234b8f]'}`}
        >
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover mix-blend-overlay opacity-80 transition-transform group-hover:scale-105 select-none overflow-hidden [text-indent:-9999px]"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-heading text-xl">{category.name}</h3>
            {typeof category.productCount === 'number' && (
              <p className="text-sm text-white/80">{category.productCount} products</p>
            )}
          </div>
          {category.productCount !== undefined && (
            <Badge
              className={`absolute top-3 right-3 backdrop-blur-md font-bold text-xs shadow-xs ${
                category.productCount === 0
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {category.productCount === 0 ? 'Coming Soon ✨' : `${category.productCount} items`}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
