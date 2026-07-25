type ProductRatingProps = {
  rating: number;
  reviewCount?: number;
  className?: string;
};

export function ProductRating({ rating, reviewCount, className }: ProductRatingProps) {
  const rounded = Math.round(rating);
  return (
    <div className={className || 'flex items-center gap-1 text-sm text-slate-600'}>
      <span className="font-semibold text-navy">{rounded}/5</span>
      {reviewCount ? <span className="text-slate-500">({reviewCount})</span> : null}
    </div>
  );
}
