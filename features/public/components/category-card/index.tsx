import { Category } from '@/features/public/lib/types';
import { Card } from '@/components/ui/card';

type CategoryCardProps = {
  category: Category;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card>
      {category.badge && (
        <span className="mb-3 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-navy">
          {category.badge}
        </span>
      )}
      <h3 className="font-heading text-2xl text-navy">{category.name}</h3>
      <p className="mt-2 text-sm text-slate-600">{category.description}</p>
    </Card>
  );
}
