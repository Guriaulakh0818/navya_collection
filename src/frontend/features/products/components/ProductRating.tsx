import { Star } from 'lucide-react';

type ProductRatingProps = {
  rating: number;
  reviewCount?: number;
  className?: string;
};

export function ProductRating({ rating, reviewCount, className }: ProductRatingProps) {
  const formattedRating = Number(rating || 4.8).toFixed(1);
  const totalReviews = reviewCount || 15;

  return (
    <div className={className || 'flex items-center gap-1.5 text-xs text-slate-600 font-medium'}>
      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-800 font-extrabold text-[11px] shadow-xs">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
        <span>{formattedRating}</span>
      </div>
      <span className="text-slate-500 font-medium">({totalReviews} verified reviews)</span>
    </div>
  );
}
