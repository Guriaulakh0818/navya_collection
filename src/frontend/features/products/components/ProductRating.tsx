import { Star } from 'lucide-react';

type ProductRatingProps = {
  rating?: number | null;
  reviewCount?: number | null;
  className?: string;
};

export function ProductRating({ rating, reviewCount, className }: ProductRatingProps) {
  const numericRating = rating ? Number(rating) : 0;
  const totalReviews = reviewCount ? Number(reviewCount) : 0;

  if (numericRating <= 0 && totalReviews <= 0) {
    return (
      <div className={className || 'flex items-center gap-1.5 text-xs text-slate-400 font-medium'}>
        <span>No reviews yet</span>
      </div>
    );
  }

  const formattedRating = numericRating > 0 ? numericRating.toFixed(1) : 'New';

  return (
    <div className={className || 'flex items-center gap-1.5 text-xs text-slate-600 font-medium'}>
      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-800 font-extrabold text-[11px] shadow-xs">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
        <span>{formattedRating}</span>
      </div>
      {totalReviews > 0 && (
        <span className="text-slate-500 font-medium">
          ({totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
