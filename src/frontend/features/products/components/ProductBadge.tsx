import { Badge } from '@/components/ui/badge';

type ProductBadgeProps = {
  type: 'new' | 'best_seller' | 'trending' | 'sale';
  text: string;
  className?: string;
};

export function ProductBadge({ type, text, className }: ProductBadgeProps) {
  if (type === 'sale') {
    return (
      <Badge
        variant="destructive"
        className={`bg-orange text-white border-orange ${className || ''}`}
      >
        {text}
      </Badge>
    );
  }
  return (
    <Badge variant="default" className={`bg-navy text-white border-navy ${className || ''}`}>
      {text}
    </Badge>
  );
}
