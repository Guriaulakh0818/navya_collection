import { formatPrice as formatPriceUtil } from '../utils/product.utils';

type ProductPriceProps = {
  price: number;
  compareAtPrice?: number;
  className?: string;
};

export function ProductPrice({ price, compareAtPrice, className }: ProductPriceProps) {
  return (
    <div className={className || 'flex items-center gap-2'}>
      <span className="font-semibold text-navy">{formatPriceUtil(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-sm text-brand-muted line-through">
          {formatPriceUtil(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
