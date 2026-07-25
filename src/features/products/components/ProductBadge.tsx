import { Badge } from '@/components/ui/badge';

type ProductBadgeProps = {
  type: 'new' | 'best_seller' | 'trending' | 'sale';
  text: string;
  className?: string;
};

export function ProductBadge({ type, text, className }: ProductBadgeProps) {
  const variant = type === 'sale' ? 'destructive' : 'default';
  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
}
